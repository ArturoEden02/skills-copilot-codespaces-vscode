// Create web server
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');
const { randomBytes } = require('crypto');
const app = express();
app.use(bodyParser.json());
app.use(cors());

// Create comments database
const commentsByPostId = {};

// Get comments by post id
app.get('/posts/:id/comments', (req, res) => {
  res.send(commentsByPostId[req.params.id] || []); // if no comments, return empty array
});

// Create comment
app.post('/posts/:id/comments', async (req, res) => {
  const commentId = randomBytes(4).toString('hex'); // generate random id
  const { content } = req.body; // get content from request body

  const comments = commentsByPostId[req.params.id] || []; // get comments from database
  comments.push({ id: commentId, content, status: 'pending' }); // add new comment to comments array
  commentsByPostId[req.params.id] = comments; // update database

  // Send event to event bus
  await axios.post('http://event-bus-srv:4005/events', {
    type: 'CommentCreated',
    data: {
      id: commentId,
      content,
      postId: req.params.id,
      status: 'pending',
    },
  });

  res.status(201).send(comments); // return new comments array
});

// Receive event from event bus
app.post('/events', async (req, res) => {
  console.log('Event Received:', req.body.type);

  const { type, data } = req.body; // get event data

  if (type === 'CommentModerated') {
    // get comment from database
    const { postId, id, status, content } = data;
    const comments = commentsByPostId[postId];
    const comment = comments.find((comment) => comment.id === id);

    // update comment status in database
    comment.status = status;

    // Send event to event bus
    await axios.post('http://event-bus-srv:4005/events', {
      type: 'CommentUpdated',
      data: {
        id,
        postId,
        status,
        content,
      },
    });
  }

  res.send({}); // return empty object
});

// Start server