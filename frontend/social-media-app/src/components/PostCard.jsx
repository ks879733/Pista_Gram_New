import React, { useState } from "react";
import { Heart, MessageCircle, Trash2, MapPin } from "lucide-react";
import api, { API_URL } from "../lib/api";
import Comment from "./Comment";

const PostCard = ({ post, currentUser, onDelete }) => {
  const [liked, setLiked] = useState(
    post.like?.some((id) => (id?._id || id)?.toString() === currentUser?._id?.toString())
  );
  const [likes, setLikes] = useState(post.like?.length || 0);
  const [showComments, setShowComments] = useState(false);

  const toggleLike = async () => {
    try {
      const { data } = await api.patch(`/posts/${post._id}/like`);
      setLiked(data.liked);
      setLikes(data.likedCount);
    } catch (error) {
      console.error(error);
    }
  };

  const mediaUrl = (name) => `${API_URL}/uploads/posts/${name}`;

  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between px-5 py-4">
        <div>
          <p className="font-bold">@{post.user?.username || "user"}</p>
          {post.user?.profileName && <p className="text-xs text-slate-400">{post.user.profileName}</p>}
        </div>

        {post.user?._id?.toString() === currentUser?._id?.toString() && (
          <button onClick={() => onDelete?.(post._id)} className="rounded-full p-2 text-slate-400 hover:bg-red-50 hover:text-red-500">
            <Trash2 className="h-5 w-5" />
          </button>
        )}
      </div>

      {post.media?.length > 0 && (
        <div className="grid gap-1 bg-slate-100">
          {post.media.map((file) =>
            file.mediaType === "video" ? (
              <video key={file._id || file.name} controls className="max-h-[620px] w-full object-cover">
                <source src={mediaUrl(file.name)} />
              </video>
            ) : (
              <img key={file._id || file.name} src={mediaUrl(file.name)} alt="Post" className="max-h-[620px] w-full object-cover" />
            )
          )}
        </div>
      )}

      <div className="p-5">
        <div className="flex items-center gap-2">
          <button onClick={toggleLike} className={`flex items-center gap-2 rounded-full px-3 py-2 ${liked ? "bg-pink-50 text-pink-600" : "bg-slate-100 text-slate-600"}`}>
            <Heart className={`h-5 w-5 ${liked ? "fill-current" : ""}`} />
            {likes}
          </button>

          <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-slate-600">
            <MessageCircle className="h-5 w-5" />
            <span>{post.comments?.length || 0}</span>
          </button>
        </div>

        {post.captions && <p className="mt-4 text-slate-700">{post.captions}</p>}
        {post.location && (
          <p className="mt-2 text-sm text-slate-400"><MapPin className="mr-1 inline h-4 w-4" />{post.location}</p>
        )}
        {post.tags && <p className="mt-2 text-sm text-pink-500">{Array.isArray(post.tags) ? post.tags.map((t) => `#${t}`).join(" ") : post.tags}</p>}

        {showComments && <Comment postId={post._id} />}
      </div>
    </article>
  );
};

export default PostCard;
