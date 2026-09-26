import React, { useState } from "react";
import { ImagePlus, MapPin, Hash, ArrowLeft, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import MainLayout from "../components/MainLayout";
import api from "../lib/api";

const CreatePost = () => {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [caption, setCaption] = useState("");
  const [tags, setTags] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const chooseFiles = (event) => {
    const selectedFiles = Array.from(event.target.files || []);

    if (selectedFiles.length > 10) {
      setMessage("You can upload maximum 10 files.");
      setFiles(selectedFiles.slice(0, 10));
      return;
    }

    const invalidFile = selectedFiles.find((file) => file.size > 30 * 1024 * 1024);
    if (invalidFile) {
      setMessage(`${invalidFile.name} is bigger than 30MB.`);
      return;
    }

    setMessage("");
    setFiles(selectedFiles);
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, fileIndex) => fileIndex !== index));
  };

  const submit = async (event) => {
    event.preventDefault();

    if (!files.length) {
      setMessage("Please choose at least one image or video.");
      return;
    }

    const formData = new FormData();

    // Backend multer expects the field name: media
    files.forEach((file) => formData.append("media", file));

    formData.append("caption", caption.trim());
    formData.append("location", location.trim());

    // Backend has tags as an array. Send every tag separately.
    tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)
      .forEach((tag) => formData.append("tags", tag));

    setLoading(true);
    setMessage("");

    try {
      await api.post("/posts", formData);
      navigate("/home");
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to create post.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Link
          to="/home"
          className="mb-5 inline-flex items-center text-sm font-semibold text-slate-500 hover:text-pink-500"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to feed
        </Link>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-7">
            <p className="font-semibold text-pink-500">Create</p>
            <h1 className="text-3xl font-black">Share a moment</h1>
            <p className="mt-2 text-sm text-slate-500">
              Add photos or videos, then write a caption for your post.
            </p>
          </div>

          <form onSubmit={submit} className="space-y-5">
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-pink-200 bg-pink-50 p-10 text-center transition hover:bg-pink-100">
              <ImagePlus className="h-10 w-10 text-pink-500" />
              <span className="mt-3 font-bold text-slate-700">Choose photos or videos</span>
              <span className="mt-1 text-sm text-slate-400">
                Maximum 10 files • Maximum 30MB per file
              </span>
              <input
                type="file"
                multiple
                accept="image/jpeg,image/jpg,image/png,image/gif,video/mp4,video/quicktime"
                onChange={chooseFiles}
                className="hidden"
              />
            </label>

            {files.length > 0 && (
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="mb-3 text-sm font-bold text-slate-700">
                  Selected files ({files.length})
                </p>
                <div className="space-y-2">
                  {files.map((file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      className="flex items-center justify-between rounded-xl bg-white px-3 py-2"
                    >
                      <p className="min-w-0 truncate text-sm text-slate-600">{file.name}</p>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="ml-3 rounded-full p-1 text-slate-400 hover:bg-red-50 hover:text-red-500"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <textarea
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
              rows="4"
              placeholder="Write a caption..."
              className="w-full rounded-2xl bg-slate-100 p-4 outline-none focus:ring-2 focus:ring-pink-200"
            />

            <div className="flex items-center rounded-2xl bg-slate-100 px-4 py-3">
              <Hash className="h-5 w-5 text-slate-400" />
              <input
                value={tags}
                onChange={(event) => setTags(event.target.value)}
                placeholder="Tags: travel, friends, food"
                className="ml-3 w-full bg-transparent outline-none"
              />
            </div>

            <div className="flex items-center rounded-2xl bg-slate-100 px-4 py-3">
              <MapPin className="h-5 w-5 text-slate-400" />
              <input
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="Location"
                className="ml-3 w-full bg-transparent outline-none"
              />
            </div>

            {message && (
              <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{message}</p>
            )}

            <button
              type="submit"
              disabled={loading || !files.length}
              className="w-full rounded-2xl bg-pink-500 py-3.5 font-bold text-white transition hover:bg-pink-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Publishing..." : "Publish Post"}
            </button>
          </form>
        </div>
      </div>
    </MainLayout>
  );
};

export default CreatePost;
