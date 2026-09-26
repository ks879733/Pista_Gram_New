const express = require('express');
const User = require("../models/user")
const bcrypt = require('bcrypt');
const authMiddleware = require("../middleware/authMiddleware");
const jwt = require('jsonwebtoken');
const sendMail = require("../config/smtp");
const authMidlleware = require('../middleware/authMiddleware');
const router = express.Router();

router.post("/", async (req, res) => {
  const { username, email, password } = req.body;

  if(!username || !email || !password) {
    return res.status(400).json({message: "Missing feild required", success: false});
  }

  const user = await User.findOne({$or: [{username: username}, {email: email}]});

  if(user){
    return res.status(400).json({
      message: user.username === username ? "Username is already taken" : "Email is already taken", success: false
    })
  }
  const hashedPassword = await bcrypt.hash(password, 10)
  const newUser = new User({
    username,
    email,
    password: hashedPassword
  })
  await newUser.save();
  const {accessToken, refreshToken} = generateToken({
    _id: newUser._id,
    username: newUser.username
  })
  const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
  newUser.refreshToken = hashedRefreshToken;
  await newUser.save();

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 *1000 // 30days
  })
  res.status(201).json(accessToken);
});

router.post("/login",async (req, res) => {
  const { username, password } = req.body;
  if(!username || !password) {
    return res.status(400).json({success: false, message: "Please provide username or password"})
  }
  const user = await User.findOne({username});
  if(!user) {
    return res.status(401).json({message: "Invalid user credential"});
  }
  const validPassword = await bcrypt.compare(password, user.password);
  if(!validPassword) {
    return res.status(401).json({success: false, message: "Invalid credentials"})
  }
  const {accessToken, refreshToken} = generateToken({
    _id: user._id,
    username: user.username
  })
  const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
  user.refreshToken = hashedRefreshToken;
  await user.save();

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 *1000 // 30days
  })
  res.json(accessToken);

});

router.post("/refresh", async (req, res) => {
  const userRefreshToken = req.cookies.refreshToken;
  if(!userRefreshToken) return res.status(404).json({message: "Refresh Token not found"})
  let decodedUser
  try {
    decodedUser = jwt.verify(userRefreshToken, process.env.REFRESH_TOKEN_KEY);
    
  } catch (error) {
    return res.status(403).json({message: "Invalid refreshToken"});
  }

  const user = await User.findById(decodedUser._id);
  if(!user) return res.status(404).json({message: "User Not found"})

  const isValid = await bcrypt.compare(userRefreshToken, user.refreshToken);
  if(!isValid) {
    return res.status(403).json({message: "refresh token is not valid"});
  }

  const {accessToken, refreshToken} = generateToken({
    _id: user._id,
    username: user.username
  })
  const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
  user.refreshToken = hashedRefreshToken;
  await user.save();

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 *1000 // 30days
  })
  res.json(accessToken);
});

router.post("/logout", async (req, res) => {
  const userRefreshToken = req.cookies.refreshToken;
  if(!userRefreshToken) return res.status(404).json({message: "Refresh Token not found"})
  let decodedUser
  try {
    decodedUser = jwt.verify(userRefreshToken, process.env.REFRESH_TOKEN_KEY);
    
  } catch (error) {
    return res.status(403).json({message: "Invalid refreshToken"});
  }

  const user = await User.findById(decodedUser._id);
  if(!user) return res.status(404).json({message: "User Not found"})

  
  user.refreshToken = null;
  await user.save();

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 *1000 // 30days
  })
  res.json({message: "LogedOut Successfully"});
});

router.get("/", authMidlleware, async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");

  if(!user) {
    return res.status(404).json({success: false, message: "User not found"});
  }
  res.json(user);
});

router.get("/users", authMidlleware, async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select("_id username profileName bio isVerified isPrivate followers following followRequest")
      .sort({ username: 1 });

    const suggestions = users.map((user) => {
      const currentUserId = req.user._id.toString();
      const isFollowing = user.followers.some((id) => id.toString() === currentUserId);
      const isRequested = user.followRequest.some((id) => id.toString() === currentUserId);

      return {
        _id: user._id,
        username: user.username,
        profileName: user.profileName,
        bio: user.bio,
        isVerified: user.isVerified,
        isPrivate: user.isPrivate,
        followStatus: isFollowing ? "following" : isRequested ? "requested" : "follow"
      };
    });

    res.json(suggestions);
  } catch (error) {
    res.status(500).json({ message: "Unable to load user suggestions" });
  }
});

router.post("/request-reset-password", async (req, res) => {
  const {email} = req.body;
  if(!email) {
    return res.status(400).json({message: "Please enter your email"})
  }

  let user = await User.findOne({email: email});
  if(!user) {
    return res.status(404).json({succes: false, message: "Please provide registered email"});
  }
  const resetToken = jwt.sign({_id:user._id}, process.env.SECRET_RESET_KEY, {expiresIn: "1h"});
  user.resetToken = resetToken;
  user.resetTokenExpireies = Date.now() + 60 * 60 * 1000
  await user.save();
  const resetLink =
    `http://localhost:5173/reset-password?token=${resetToken}`;

  await sendMail(
    user.email,
    "Reset Your Password",
    `
      Password Reset

      You requested to reset your password

      Click the link below to reset your password:

      ${resetLink}
        Reset Password
      

      This link will expire in 1 hour. Do not share this password anyone
    `
  );
  res.json({
    success: true,
    message: "Password reset link sent to your email",resetToken: resetToken
  });
});

router.post("/reset-password", async (req, res) => {
  const {resetToken, newPassword} = req.body;
  const decodedUser = jwt.verify(resetToken, process.env.SECRET_RESET_KEY);
  let user = await User.findById(decodedUser._id);

  if(!user || user.resetToken !== resetToken || user.resetTokenExpireies <= Date.now()) {
    return res.status(400).json({success: false, message: "Invalid or expire token"});
  }

  
const hashedPassword = await bcrypt.hash(newPassword, 10);
user.password = hashedPassword
user.resetToken = null;
user.resetTokenExpireies = null;
await user.save();
res.json({message: "Pasword reset successfully"});
});

router.post("/:userId/follow", authMidlleware, async (req, res) => {
  const userId = req.params.userId;
  const currentUserId = req.user._id

  if(userId === currentUserId.toString() ){
    return res.status(400).json({message: "You can't follow yourselfe"})
  }

  const userToFollow = await User.findById(userId);
  if(!userToFollow) {
    return res.status(404).json({message: "User not found"})
  }

  const currentUser = await User.findById(currentUserId);
  if(!currentUser) {
    return res.status(404).json({message: "User not found"})
  }
  
  if(userToFollow.isPrivate) {
      //Logic for private account
    if(userToFollow.followRequest.includes(currentUserId)){
      return res.status(400).json({message: "Follow request Already sent"})
    }
    else{
      userToFollow.followRequest.push(currentUserId);
      await userToFollow.save();
      return res.json({message: "Follow request sent successfully"});
    }

  }else{
    //logic for public account

    if(userToFollow.followers.includes(currentUserId)){
      return res.status(400).json({message: "Already following the user"})
    }else{
      userToFollow.followers.push(currentUserId);
      currentUser.following.push(userId);
  
      await userToFollow.save()
      await currentUser.save();
      return res.json({message: "User followed successfully"})
    }
  }
});

router.post("/rejected-request/:requesterId", authMidlleware, async (req, res) => {
  const requesterId = req.params.requesterId;
  const currentUserId = req.user._id;
  if(requesterId === currentUserId.toString() ){
    return res.status(400).json({message: "You can't Unfollow it selfe"})
  }

  const requesterUser = await User.findById(requesterId);
  if(!requesterUser) {
    return res.status(404).json({message: "User not found"})
  }

  const currentUser = await User.findById(currentUserId);
  if(!currentUser) {
    return res.status(404).json({message: "User not found"})
  }

  const updatedRequest = currentUser.followRequest.filter((id) => id.toString() !== requesterId.toString());

  currentUser.followRequest = updatedRequest;
  await currentUser.save();
  res.json({message: "follow rejected successfully"})

})

router.post("/accepted-request/:requesterId", authMidlleware, async (req, res) => {
  const requesterId = req.params.requesterId;
  const currentUserId = req.user._id;
  if(requesterId === currentUserId.toString() ){
    return res.status(400).json({message: "You can't Unfollow it selfe"})
  }

  const requesterUser = await User.findById(requesterId);
  if(!requesterUser) {
    return res.status(404).json({message: "User not found"})
  }

  const currentUser = await User.findById(currentUserId);
  if(!currentUser) {
    return res.status(404).json({message: "User not found"})
  }

  const updatedRequest = currentUser.followRequest.filter((id) => id.toString() !== requesterId.toString());

  currentUser.followRequest = updatedRequest;
  currentUser.followers.push(requesterId);
  requesterUser.following.push(currentUserId)
  await currentUser.save();
  await requesterUser.save();
  res.json({message: "follow accepted successfully"})

});

router.get("/follow-requests", authMidlleware, async (req, res) => {

  try {
    const currentUserId = req.user._id;
  const currentUser = await User.findById(currentUserId).populate("followRequest", "_id username profileName accountStatus isVerified");

  if(!currentUser) {
    return res.status(404).json({message: "User not found"});
  }

  res.status(200).json({
      requests: currentUser.followRequest
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Internal server error"
    });
  }
  
})
router.get("/:userId/followers", authMidlleware, async (req, res) => {
  const userId = req.params.userId;
  const currentUserId = req.user._id;

  const user = await User.findById(userId).populate("followers", "_id username accountStatus isVerified");
  if(!user) {
    return res.status(404).json({message: "User not found"})
  }

  const currentUser = await User.findById(currentUserId);
  if(!currentUser) {
    return res.status(404).json({message: "User not found"})
  }
  if(currentUser.following.includes(userId) || !user.isPrivate) {
    return res.json(user.followers);
  }else{
    return res.status(400).json({message: "Cant get follower list account is private"})
  }

});

router.get("/:userId/following", authMidlleware, async (req, res) => {
  const userId = req.params.userId;
  const currentUserId = req.user._id;
  const user = await User.findById(userId).populate("following", "_id username accountStatus isVerified");
  if(!user) {
    return res.status(404).json({message: "User not found"})
  }
  const currentUser = await User.findById(currentUserId);
  if(!currentUser) {
    return res.status(404).json({message: "User not found"})
  }
  if(currentUser.followers.includes(userId) || !user.isPrivate) {
    return res.json(user.following);
  }else{
    return res.status(400).json({message: "Can't get following list account is private"})
  }
});

router.post("/:userId/unfollow", authMidlleware, async (req, res) => {
  const userId = req.params.userId;
  const currentUserId = req.user._id;
  const user = await User.findById(userId);

  if(!user) {
    return res.status(404).json({message: "User not found"})
  }
  const currentUser = await User.findById(currentUserId);
  if(!currentUser) {
    return res.status(404).json({message: "User not found"})
  }
  if(!user.followers.includes(currentUserId)) {
    return res.status(400).json({message: "User is not available in the f"})
  }
  const updatedCurrentUserFollowings = currentUser.following.filter((id) => id.toString() !== userId.toString())
  const updatedUserFollowers = user.followers.filter((id) => id.toString() !== currentUserId.toString())
  currentUser.following = updatedCurrentUserFollowings;
  user.followers = updatedUserFollowers;
  await currentUser.save();
  await user.save();
  res.json({message: "Unfollow successfully"})

})

router.get("/user/:userId", authMidlleware, async (req, res) => {
  const targetUserId = req.params.userId;
  const currentUserId = req.user._id;
  const user = await User.findById(targetUserId)
    .select("-password");

  if (!user) {
    return res.status(404).json({
      message: "User not found"
    });
  }

  const isFollowing = user.followers.some((id) => id.toString() === currentUserId.toString());

  const isRequested = user.followRequest.some((id) => id.toString() === currentUserId.toString());

  let followStatus = "follow";
  if(isFollowing) {
    followStatus = "following"
  }else if(isRequested) {
    followStatus = "requested";
  }
  res.json({
    user,
    followStatus
  });
});

router.get("/users", authMidlleware, async (req, res) => {

  const currentUserId = req.user._id;

  const users = await User.find({
    _id: { $ne: currentUserId }
  }).select("-password -refreshToken -resetToken");

  res.json(users);
});

router.get("/followers", authMidlleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("followers", "_id username profileName accountStatus isVerified");
  
    if(!user) {
      return res.status(404).json({message: "User not found"})
    }
    res.json({
      followers: user.followers
    })
    
  } catch (error) {
    res.status(500).json({
      message: "Unable to get followers"
       });
  }

})
router.get("/following", authMidlleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("following", "_id username profileName accountStatus isVerified ");
  
    if(!user) {
      return res.status(404).json({message: "User not found"})
    }
    res.json({
      following: user.following
    })
    
  } catch (error) {
    res.status(500).json({
      message: "Unable to get following"
       });
  }

})

const generateToken = (data) => {
  const accessToken = jwt.sign(data, process.env.ACCESS_TOKEN_KEY);
  const refreshToken = jwt.sign({_id: data._id}, process.env.REFRESH_TOKEN_KEY, {expiresIn: "30d"});
  return {accessToken, refreshToken}
}

module.exports = router;