const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

const mongoose = require('mongoose');

mongoose.connect('process.env.MONGOCN', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const PixelSchema = new mongoose.Schema({
  left: Number,
  top: Number,
  fill: String,
});

const Pixel = mongoose.model('Pixel', PixelSchema);


app.use(express.static(path.join(__dirname, 'public')));

// Inside your existing code
// Inside your existing code
io.on('connection', (socket) => {
  console.log(`User ${socket.id} connected`);

  // Retrieve and send existing pixels to the newly connected client
  Pixel.find({})
    .then((pixels) => {
      socket.emit('initialPixels', pixels);
    })
    .catch((err) => {
      console.error(err);
    });

  socket.on('pixelPlaced', async (data) => {
    // Check if a pixel with the same position already exists
    const existingPixel = await Pixel.findOne({
      left: data.left,
      top: data.top,
    });

    if (existingPixel) {
      // If the new pixel color is the same as the existing one, delete the existing pixel
        await Pixel.deleteOne({ _id: existingPixel._id });
    }

    // Create a new pixel instance
    const newPixel = new Pixel({
      left: data.left,
      top: data.top,
      fill: data.fill,
    });

    try {
      // Save the pixel to MongoDB
      await newPixel.save();
      // Broadcast the new pixel to all clients
      io.emit('pixelPlaced', data);
    } catch (err) {
      console.error(err);
    }
  });

  socket.on('disconnect', () => {
    console.log(`User ${socket.id} disconnected`);
  });
});


server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
