const mongoose = require('mongoose');
const supertest = require('supertest');
const app = require('../app');

const api = supertest(app);
const Blog = require('../models/blog');

const blogs = [
  {
    title: 'React patterns',
    author: 'Michael Chan',
    url: 'https://reactpatterns.com/',
    likes: 7
  },
  {
    title: 'Go To Statement Considered Harmful',
    author: 'Edsger W. Dijkstra',
    url: 'http://www.u.arizona.edu/~rubinson/copyright_violations/Go_To_Considered_Harmful.html',
    likes: 5
  }
];

beforeEach(async () => {
  await Blog.deleteMany({});
  await Blog.insertMany(blogs);
});

describe('Fetching blogs' , () => {
  test('All blogs are fetched', async () => {
    const response = await api.get('/api/blogs');
    expect(response.body).toHaveLength(blogs.length);
  });

  test('Checks if a blog have an id property', async () => {
    const response = await api.get('/api/blogs');
    expect(response.body[0].id).toBeDefined();
  });
});

describe('Fetching a specific blog', () => {
  test('which has a valid existing id success', async () => {
    let initialBlogs = await Blog.find({});
    initialBlogs = initialBlogs.map(b => b.toJSON());
    const blogToFetch = initialBlogs[0];

    const resultBlog = await api
      .get(`/api/blogs/${blogToFetch.id}`)
      .expect(200)
      .expect('Content-Type', /application\/json/);

    expect(resultBlog.body).toEqual(blogToFetch);
  });

  test('which has a valid non-existing id returns 404', async () => {
    const removedBlog = new Blog({
      title: 'Bye',
      author: 'removedsoon',
      url:'asd.com',
      likes: 8
    });

    await removedBlog.save();
    await removedBlog.remove();

    const nonExistingId = removedBlog._id.toString();

    await api
      .get(`/api/blogs/${nonExistingId}`)
      .expect(404);
  });

  test('which has an invalid id', async () => {
    const id = 'panko';
    await api
      .get(`/api/blogs/${id}`)
      .expect(400);
  });
});

describe('Adding valid blogs', () => {
  test('Checks if a valid blog can be added', async () => {
    const newBlog = {
      title: 'My new song',
      author: 'Chencho Perez',
      url: 'gatonco.com',
      likes: 77
    };

    await api
      .post('/api/blogs')
      .send(newBlog)
      .expect(201)
      .expect('Content-Type', /application\/json/);

    const response = await api.get('/api/blogs');
    const titles = response.body.map(b => b.title);

    expect(response.body).toHaveLength(blogs.length + 1);
    expect(titles).toContain('My new song');
  });

  test('Adding a blog without likes property defaults to 0 likes', async () => {
    const newBlog = {
      title: 'Ipsum Lorem',
      author: 'Examplifly',
      url: 'example.com'
    };

    await api
      .post('/api/blogs')
      .send(newBlog)
      .expect(201)
      .expect('Content-Type', /application\/json/);

    const response = await api.get('/api/blogs');

    expect(response.body).toHaveLength(blogs.length + 1);
    expect(response.body.slice(-1)[0].likes).toBe(0);
  });
});

describe('Adding invalid blogs', () => {
  test('You can not add a blog missing a title', async () => {
    const newBlog = {
      author: 'Examplifly',
      url: 'example.com',
      likes: 30
    };

    await api
      .post('/api/blogs')
      .send(newBlog)
      .expect(400);

    const response = await api.get('/api/blogs');
    expect(response.body).toHaveLength(blogs.length);
  });

  test('You can not add a blog missing an author', async () => {
    const newBlog = {
      title: 'Ipsum Lorem',
      url: 'example.com',
      likes: 30
    };

    await api
      .post('/api/blogs')
      .send(newBlog)
      .expect(400);

    const response = await api.get('/api/blogs');
    expect(response.body).toHaveLength(blogs.length);
  });
});

describe('Deleting', () => {
  test('an existing blog is successful', async () => {
    let initialBlogs = await Blog.find({});
    initialBlogs = initialBlogs.map(b => b.toJSON());
    const blogToDelete = initialBlogs[0];

    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .expect(204);

    const blogsAtEnd = await api
      .get('/api/blogs');

    expect(blogsAtEnd.body).toHaveLength(initialBlogs.length - 1);

    const deletedBlog = blogsAtEnd.body.find(b => b.id === blogToDelete);

    expect(deletedBlog).toBeUndefined();
  });
});

describe('Updating a blog', () => {
  test('which exists using a valid object', async () => {
    const updatedBlog = {
      title: 'React patterns',
      author: 'Chencho Perez',
      url: 'https://reactpatterns.com/',
      likes: 35
    };

    let initialBlogs = await Blog.find({});
    initialBlogs = initialBlogs.map(b => b.toJSON());
    const blogToUpdate = initialBlogs[0];

    await api
      .put(`/api/blogs/${blogToUpdate.id}`)
      .send(updatedBlog)
      .expect(200);

    const blogsAtEnd = await api
      .get('/api/blogs');

    expect(blogsAtEnd.body.map(b => b.author)).toContain('Chencho Perez');
  });

  test('which exists using an object without author does not change anything', async () => {
    const updatedBlog = {
      title: 'React patterns',
      url: 'https://reactpatterns.com/',
      likes: 35
    };

    let initialBlogs = await Blog.find({});
    initialBlogs = initialBlogs.map(b => b.toJSON());
    const blogToUpdate = initialBlogs[0];

    await api
      .put(`/api/blogs/${blogToUpdate.id}`)
      .send(updatedBlog)
      .expect(400);

    const blogsAtEnd = await api
      .get('/api/blogs');

    expect(blogsAtEnd.body.map(b => b.author)).toContain('Michael Chan');
  });

  test('which exists using an object without title does not change anything', async () => {
    const updatedBlog = {
      author: 'Chencho Perez',
      url: 'https://reactpatterns.com/',
      likes: 35
    };

    let initialBlogs = await Blog.find({});
    initialBlogs = initialBlogs.map(b => b.toJSON());
    const blogToUpdate = initialBlogs[0];

    await api
      .put(`/api/blogs/${blogToUpdate.id}`)
      .send(updatedBlog)
      .expect(400);

    const blogsAtEnd = await api
      .get('/api/blogs');

    expect(blogsAtEnd.body.map(b => b.author)).toContain('Michael Chan');
  });

  test('which does not exist returns 404', async () => {
    const updatedBlog = {
      title: 'React patterns',
      author: 'Chencho Perez',
      url: 'https://reactpatterns.com/',
      likes: 35
    };

    const removedBlog = new Blog({
      title: 'Bye',
      author: 'removedsoon',
      url:'asd.com',
      likes: 8
    });

    await removedBlog.save();
    await removedBlog.remove();

    const nonExistingId = removedBlog._id.toString();

    let initialBlogs = await Blog.find({});
    initialBlogs = initialBlogs.map(b => b.toJSON());

    await api
      .put(`/api/blogs/${nonExistingId}`)
      .send(updatedBlog)
      .expect(404);

    const blogsAtEnd = await api
      .get('/api/blogs');

    expect(blogsAtEnd.body).toHaveLength(initialBlogs.length);
  });
});

afterAll(async () => {
  await mongoose.connection.close();
});