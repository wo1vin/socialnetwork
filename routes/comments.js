const express = require("express");
const router = express.Router();
// const upload = require("../middleware/multer");
const commentsController = require("../controllers/comments");
const { ensureAuth, ensureGuest } = require("../middleware/auth");

//Comment Routes - simplified for now

router.post("/createComment/:id", commentsController.createComment);

// future implementation
// router.post("/createPost", upload.single("file"), postsController.createPost);
// router.get("/:id", ensureAuth, postsController.getPost);
// router.put("/likePost/:id", postsController.likePost);
// router.delete("/deletePost/:id", postsController.deletePost);

module.exports = router;