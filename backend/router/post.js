const express = require('express');
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const postUpload = require('../config/multer-upload');
const path = require('path');
const fs = require('fs/promises');
const Post = require('../models/post');
const User = require('../models/user');
const authMidlleware = require('../middleware/authMiddleware');

router.post("/", authMidlleware, postUpload.array("media", 10), async(req, res) => {
  if(!req.files || req.files.length === 0) {
    return res.status(400).json({message: "Atleast one media file required"})
  }
  const {caption, tags, location} = req.body;
  const media = req.files.map(file => {
    return {
      name: file.filename,
      mediaType: file.mimetype.startsWith("image") ? "image" : "video"
    }
  });

  const newPost = new Post({
    user: req.user._id,
    captions: caption,
    tags,
    location,
    media
  })
  await newPost.save()

  return res.status(201).json({message: "New post Created", post: newPost});
});

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
  const postId = req.params.postId;
  const userId = req.user._id;
  const post = await Post.findById(postId);
  if(!post) return res.status(404).json({message: "Post not found"});

  if(post.user.toString() !== userId.toString()) {
    return res.status(403).json({mesaage: "Unauthorized to delete this"})
  }
  post.media.forEach(async (file) => {
    const filePath = path.join(__dirname, "../uploads/posts", file.name);

    try {
      await fs.unlink(filePath)
    } catch (error) {
      console.log(`Error in deleting file ${filePath}`, error);
    }
  });

  await post.deleteOne();

  res.json({message: "Post deleted successsfully!"});

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

router.get("/:postId/comments/reply", authMidlleware, async (req, res) => {
  const postId = req.params.postId;
  const post = await Post.findById(postId).select("comments")
      .populate("comments.user", "_id username profileName")
      .populate("comments.replies.user", "_id username profileName");

  res.json({
    reply: post.comments.reply
  })
})

module.exports = router;