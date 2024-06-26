const cloudinary = require("../middleware/cloudinary");
const Post = require("../models/Post");
const Comment = require("../models/Comment");
const User = require("../models/User");

module.exports = {
  getProfile: async (req, res) => {
    try {
      const posts = await Post.find({ user: req.user.id });
      res.render("profile.ejs", { posts: posts, user: req.user });
    } catch (err) {
      console.log(err);
    }
  },
  getFeed: async (req, res) => {
    try {
      const posts = await Post.find().sort({ createdAt: "desc" }).lean();
      res.render("feed.ejs", { posts: posts });
    } catch (err) {
      console.log(err);
    }
  },
  // include comments per post
  getPost: async (req, res) => {
    try {
      const post = await Post.findById(req.params.id);
      const author = await User.findById(post.user);
      // comments is an array of comments per post
      const comments = await Comment.find({post: req.params.id}).sort({ dateUploaded: "desc" }).lean();
      const cAuthId = comments.map((x,i) => {
        return x.user;
      })
      // cUsers is an array of user objects
      const cUsers = await User.find({_id: cAuthId})
      let usernames = [];
      function sortNames(ids,users){
        for (let i = 0; i < ids.length; i++){
          usernames.push( users.find( x => x._id == ids[i] ));
        }
        usernames = usernames.map(el => el.userName)
      }
      sortNames(cAuthId,cUsers);
      res.render("post.ejs", { post: post, author: author, comments: comments, cUsers: usernames, user: req.user });
    } catch (err) {
      console.log(err);
    }
  },
  createPost: async (req, res) => {
    try {
      // Upload image to cloudinary
      const result = await cloudinary.uploader.upload(req.file.path);

      await Post.create({
        title: req.body.title,
        description: req.body.description,
        medium: req.body.medium,
        location: req.body.location,
        image: result.secure_url,
        cloudinaryId: result.public_id,
        dateCreated: req.body.dateCreated,
        likes: 0,
        likedBy: [],
        comments: [],
        user: req.user.id,
      });
      console.log("Post has been added!");
      res.redirect("/profile");
    } catch (err) {
      console.log(err);
    }
  },
  // need to prevent the same user from liking a post more than once
  // add a property to the post model for likedBy. 
  // check condition before find one and update.
  // if user is in likedBy array, likes: -1 and remove user from array. if user is not in array, likes: 1 and add user to array.
  likePost: async (req, res) => {
    try {
      const post = await Post.find({_id: req.params.id})
      // console.log(post);
        if (post[0].likedBy.includes(req.user.id)){
          await Post.findOneAndUpdate(
            { _id: req.params.id },
            {
              $inc: { likes: -1 },
              $pull: {likedBy: req.user.id}
            }
          );
          console.log("Likes -1");
        } else {
          await Post.findOneAndUpdate(
            { _id: req.params.id },
            {
              $inc: { likes: +1 },
              $push: {likedBy: req.user.id}
            }
          );
          console.log("Likes +1");
        }
      res.redirect(`/post/${req.params.id}`);
    } catch (err) {
      console.log(err);
    }
  },
  deletePost: async (req, res) => {
    try {
      // Find post by id
      let post = await Post.findById({ _id: req.params.id });
      // Delete image from cloudinary
      await cloudinary.uploader.destroy(post.cloudinaryId);
      // Delete post from db
      await Post.deleteOne({ _id: req.params.id });
      console.log("Deleted Post");
      res.redirect("/profile");
    } catch (err) {
      res.redirect("/profile");
    }
  },
};
