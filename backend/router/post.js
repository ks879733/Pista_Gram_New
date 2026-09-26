const express = require('express');
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const postUpload = require('../config/multer-upload');
const cloudinary = require("../config/cloudinary");
const Post = require('../models/post');
const User = require('../models/user');
const authMidlleware = require('../middleware/authMiddleware');

router.post(
  "/",
  authMidlleware,
  postUpload.array("media", 10),
  async (req, res) => {

    try {

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          message: "Atleast one media file required"
        });
      }

      const { caption, tags, location } = req.body;

      // Upload media files to Cloudinary
      const media = await Promise.all(
        req.files.map((file) => {

          return new Promise((resolve, reject) => {

            const resourceType = file.mimetype.startsWith("video")
              ? "video"
              : "image";

            const uploadStream = cloudinary.uploader.upload_stream(
              {
                folder: "pista-gram/posts",
                resource_type: resourceType
              },

              (error, result) => {

                if (error) {
                  reject(error);
                  return;
                }

                resolve({
                  url: result.secure_url,
                  publicId: result.public_id,
                  mediaType: resourceType
                });

              }
            );

            uploadStream.end(file.buffer);

          });

        })
      );

      // Create new post
      const newPost = new Post({
        user: req.user._id,
        captions: caption,
        tags,
        location,
        media
      });

      await newPost.save();

      return res.status(201).json({
        message: "New post Created",
        post: newPost
      });

    } catch (error) {

      console.error("Error creating post:", error);

      return res.status(500).json({
        message: "Post creation failed",
        error: error.message
      });

    }
  }
);

router.get("/myposts", authMidlleware, async(req, res) =>{
  const page = parseInt(req.query.page) || 1
  const limit = parseInt(req.query.limit) || 10
   
  const skip = (page - 1) * limit;

  const posts = await Post.find({user: req.user._id}).populate("user", "_id username profileName").populate("like", "_id username").sort({ createdAt: -1 }).skip(skip).limit(limit+1).lean();
  
  const hasNextPage = posts.length === limit ? true : false

  res.json({posts, page, limit, hasNextPage});
})
router.get("/following", authMidlleware, async (req, res) => {
  let { cursor } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const user = await User.findById(req.user._id).select("following");
  let query = { user: { $in: user.following } };
  if(cursor) {
    query.createdAt = { $lt: new Date (cursor) }
  }

  const posts = await Post.find(query).populate("user", "_id username profileName").populate("like", "_id username")
  .sort({ createdAt: -1 }).skip(skip).limit(limit).lean()

  const nextCursor = posts.length > 0 ? posts[posts.length - 1].createdAt: null
  const hasNextPage = posts.length === limit ? true : false
  res.json({posts, nextCursor, hasNextPage});
})
router.get("/followers", authMidlleware, async (req, res) => {
  let { cursor } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const user = await User.findById(req.user._id).select("followers");
  let query = { user: { $in: user.followers } };
  if(cursor) {
    query.createdAt = { $lt: new Date (cursor) }
  }

  const posts = await Post.find(query).populate("user", "_id username profileName").populate("like", "_id username")
  .sort({ createdAt: -1 }).skip(skip).limit(limit).lean()

  const nextCursor = posts.length > 0 ? posts[posts.length - 1].createdAt: null
  const hasNextPage = posts.length === limit ? true : false
  res.json({posts, nextCursor, hasNextPage});
});

router.delete("/:postId", authMidlleware, async (req, res) => {

  try {

    const postId = req.params.postId;
    const userId = req.user._id;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        message: "Post not found"
      });
    }

    
    if (post.user.toString() !== userId.toString()) {
      return res.status(403).json({
        message: "Unauthorized to delete this"
      });
    }

    
    for (const file of post.media) {

      try {

        await cloudinary.uploader.destroy(
          file.publicId,
          {
            resource_type: file.mediaType === "video"
              ? "video"
              : "image"
          }
        );

      } catch (error) {

        console.log(
          `Error deleting Cloudinary file ${file.publicId}:`,
          error
        );

      }
    }

    
    await post.deleteOne();

    return res.json({
      message: "Post deleted successfully!"
    });

  } catch (error) {

    console.error("Error deleting post:", error);

    return res.status(500).json({
      message: "Post deletion failed",
      error: error.message
    });

  }

});

router.patch("/:postId/like", authMidlleware, async (req, res) => {

  try {
    const postId = req.params.postId;
    const currentUserId = req.user._id;
  
    const post = await Post.findById(postId);
    if(!post) {
      return res.status(404).json({message: "Post is not found"})
    }
  
    const alreadyLiked = post.like.includes(currentUserId);
    if(alreadyLiked) {
      // agar like hai to unlike karenge
  
      post.like = post.like.filter((id) => id.toString() !== currentUserId.toString());
  
      await post.save();
      return res.status(200).json({message: "Unclike Successfully", liked: false, likedCount: post.like.length});
    }
  
    //agar user ne post like nhi kiya hai to like karne ka logic
  
    post.like.push(currentUserId);
    await post.save();
  
    return res.status(200).json({message: "post Liked", liked: true, likedCount: post.like.length});
    
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }

});

router.post("/:postId/comments", authMidlleware, async(req, res) => {
  const postId = req.params.postId;
  const userId = req.user._id;
  const {text} = req.body;

  if(!text) {
    return res.status(400).json({message: "please enter comments"})
  }
  const newComments = {
    user: userId,
    text: text.trim()
  }

  const post = await Post.findByIdAndUpdate(postId, { $push: {comments: newComments} }, {new: true});

  res.status(201).json({message: "Comment Added successfully", comment: post.comments[post.comments.length - 1]})
})
router.get("/:postId/comments", authMidlleware, async (req, res) => {
  const postId = req.params.postId;
  const post = await Post.findById(postId)
    .select("comments")
    .populate("comments.user", "_id username profileName")
    .populate("comments.replies.user", "_id username profileName");

  if(!post) {
    return res.status(404).json({
      message: "Post not found"
    })
  }

  res.status(200).json({
    comments: post.comments
  })
});

router.post("/:postId/comments/:commentId/replies", authMidlleware, async (req, res) => {

  const { postId, commentId } = req.params;
  const userId = req.user._id;
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({
      message: "Please enter reply"
    });
  }

  const post = await Post.findOneAndUpdate(
    {
      _id: postId,
      "comments._id": commentId
    },
    {
      $push: {
        "comments.$.replies": {
          user: userId,
          text: text
        }
      }
    },
    {
      new: true
    }
  );

  if (!post) {
    return res.status(404).json({
      message: "Post or comment not found"
    });
  }

  const comment = post.comments.id(commentId);
  const newReply = comment.replies[comment.replies.length - 1];

  res.status(201).json({
    message: "Reply added successfully",
    reply: newReply
  });
});

router.delete("/:postId/comments/:commentId/", authMidlleware, async (req, res) => {

  const { postId, commentId } = req.params;
  const userId = req.user._id;
 
  const post = await Post.findOneAndUpdate(
    {
      _id: postId,
      $or: [ {user: userId}, {"commentsId._id": commentId, "comments.user": userId}]
    },
    {
      $pull: {
        comments: {_id: commentId}
      }
    },
    {
      new: true
    }
  );

  if (!post) {
    return res.status(403).json({
      message: "Post or comment not found"
    });
  }
  res.status(201).json({
    message: "Comment deleted successfully",
    comments: post.comments
  });
});


router.patch("/profile", authMidlleware, async (req, res) => {

  try {
    const userId = req.user._id;
    const { username, profileName, bio } = req.body;

    if(!username && !profileName && !bio) {
      return res.status(400).json({
       message: "Please provide username, profileName or bio to update"
     })
   }
   
   const updatedData = {};
   if(username !== undefined) {
    updatedData.username = username
   }
   if(profileName !== undefined) {
    updatedData.profileName = profileName
   }
   if(bio !== undefined) {
    updatedData.bio = bio
   }

   const user = await User.findByIdAndUpdate(userId, { $set: updatedData }, { new: true, runValidators: true });

   if(!user) {
    return res.status(404).json({message: "User not found"})
   }

   res.status(200).json({
    message: "Profile updated successfully",
    user: {
      _id: user._id,
      username: user.username,
      profileName: user.profileName,
      bio: user.bio
    }
   });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Internal server error"
    });
  }
})
router.get("/:postId/comments/reply", authMidlleware, async (req, res) => {
  const postId = req.params.postId;
  const post = await Post.findById(postId).select("comments")
      .populate("comments.user", "_id username profileName")
      .populate("comments.replies.user", "_id username profileName");

  res.json({
    reply: post.comments.reply
  })
});


module.exports = router;