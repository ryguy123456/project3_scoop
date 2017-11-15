// database is let instead of const to allow us to modify it in test.js
let database = {
  users: {},
  articles: {},
  nextArticleId: 1,
  comments: {},
  nextCommentId: 1
};

const routes = {
  '/users': {
    'POST': getOrCreateUser
  },
  '/users/:username': {
    'GET': getUser
  },
  '/articles': {
    'GET': getArticles,
    'POST': createArticle
  },
  '/articles/:id': {
    'GET': getArticle,
    'PUT': updateArticle,
    'DELETE': deleteArticle
  },
  '/articles/:id/upvote': {
    'PUT': upvoteArticle
  },
  '/articles/:id/downvote': {
    'PUT': downvoteArticle
  },
  '/comments': {
    'POST': createComment
  },
  '/comments/:id': {
    'PUT': updateComment,
    'DELETE':deleteComment
  },
  '/comments/:id/upvote': {
    'PUT': upVoteComment
  },
  '/comments/:id/downvote': {
    'PUT': downVoteComment
  }
};

function getUser(url, request) {
  const username = url.split('/').filter(segment => segment)[1];
  const user = database.users[username];
  const response = {};

  if (user) {
    const userArticles = user.articleIds.map(
        articleId => database.articles[articleId]);
    const userComments = user.commentIds.map(
        commentId => database.comments[commentId]);
    response.body = {
      user: user,
      userArticles: userArticles,
      userComments: userComments
    };
    response.status = 200;
  } else if (username) {
    response.status = 404;
  } else {
    response.status = 400;
  }

  return response;
}

function getOrCreateUser(url, request) {
  const username = request.body && request.body.username;
  const response = {};

  if (database.users[username]) {
    response.body = {user: database.users[username]};
    response.status = 200;
  } else if (username) {
    const user = {
      username: username,
      articleIds: [],
      commentIds: []
    };
    database.users[username] = user;

    response.body = {user: user};
    response.status = 201;
  } else {
    response.status = 400;
  }

  return response;
}

function getArticles(url, request) {
  const response = {};

  response.status = 200;
  response.body = {
    articles: Object.keys(database.articles)
        .map(articleId => database.articles[articleId])
        .filter(article => article)
        .sort((article1, article2) => article2.id - article1.id)
  };

  return response;
}

function getArticle(url, request) {
  const id = Number(url.split('/').filter(segment => segment)[1]);
  const article = database.articles[id];
  const response = {};

  if (article) {
    article.comments = article.commentIds.map(
      commentId => database.comments[commentId]);

    response.body = {article: article};
    response.status = 200;
  } else if (id) {
    response.status = 404;
  } else {
    response.status = 400;
  }

  return response;
}

function createArticle(url, request) {
  const requestArticle = request.body && request.body.article;
  const response = {};

  if (requestArticle && requestArticle.title && requestArticle.url &&
      requestArticle.username && database.users[requestArticle.username]) {
    const article = {
      id: database.nextArticleId++,
      title: requestArticle.title,
      url: requestArticle.url,
      username: requestArticle.username,
      commentIds: [],
      upvotedBy: [],
      downvotedBy: []
    };

    database.articles[article.id] = article;
    database.users[article.username].articleIds.push(article.id);

    response.body = {article: article};
    response.status = 201;
  } else {
    response.status = 400;
  }

  return response;
}

function updateArticle(url, request) {
  const id = Number(url.split('/').filter(segment => segment)[1]);
  const savedArticle = database.articles[id];
  const requestArticle = request.body && request.body.article;
  const response = {};

  if (!id || !requestArticle) {
    response.status = 400;
  } else if (!savedArticle) {
    response.status = 404;
  } else {
    savedArticle.title = requestArticle.title || savedArticle.title;
    savedArticle.url = requestArticle.url || savedArticle.url;

    response.body = {article: savedArticle};
    response.status = 200;
  }

  return response;
}

function deleteArticle(url, request) {
  const id = Number(url.split('/').filter(segment => segment)[1]);
  const savedArticle = database.articles[id];
  const response = {};

  if (savedArticle) {
    database.articles[id] = null;
    savedArticle.commentIds.forEach(commentId => {
      const comment = database.comments[commentId];
      database.comments[commentId] = null;
      const userCommentIds = database.users[comment.username].commentIds;
      userCommentIds.splice(userCommentIds.indexOf(id), 1);
    });
    const userArticleIds = database.users[savedArticle.username].articleIds;
    userArticleIds.splice(userArticleIds.indexOf(id), 1);
    response.status = 204;
  } else {
    response.status = 400;
  }

  return response;
}

function upvoteArticle(url, request) {
  const id = Number(url.split('/').filter(segment => segment)[1]);
  const username = request.body && request.body.username;
  let savedArticle = database.articles[id];
  const response = {};

  if (savedArticle && database.users[username]) {
    savedArticle = upvote(savedArticle, username);

    response.body = {article: savedArticle};
    response.status = 200;
  } else {
    response.status = 400;
  }

  return response;
}

function downvoteArticle(url, request) {
  const id = Number(url.split('/').filter(segment => segment)[1]);
  const username = request.body && request.body.username;
  let savedArticle = database.articles[id];
  const response = {};

  if (savedArticle && database.users[username]) {
    savedArticle = downvote(savedArticle, username);

    response.body = {article: savedArticle};
    response.status = 200;
  } else {
    response.status = 400;
  }

  return response;
}

function upvote(item, username) {
  if (item.downvotedBy.includes(username)) {
    item.downvotedBy.splice(item.downvotedBy.indexOf(username), 1);
  }
  if (!item.upvotedBy.includes(username)) {
    item.upvotedBy.push(username);
  }
  return item;
}

function downvote(item, username) {
  if (item.upvotedBy.includes(username)) {
    item.upvotedBy.splice(item.upvotedBy.indexOf(username), 1);
  }
  if (!item.downvotedBy.includes(username)) {
    item.downvotedBy.push(username);
  }
  return item;
}

//checks if the comment request is valid or not
function validComment(request) {
  if (request.body.comment.body && request.body.comment.username && request.body.comment.articleId) {
    return true;
  } else {
    return false;
  }

}

//checks if the user id is in the database or not
function isUserExist(username) {
  if(database.users[username]) {
    return true;
  } else {
    return false;
  }
}

//checks if the article is in the database or not
function isArticleExist(articleId) {
  if(database.articles[articleId]) {
    return true;
  } else {
    return false;
  }
}

function createComment(url, request) {

  const response = {};
  //creates a "request comment" which will merge the body and the comment. will use this to see if it is a legit request or not
  const requestComment = request.body && request.body.comment;
  //check to see if the request has all the required fields
  if( requestComment && validComment(request) && isUserExist(request.body.comment.username) && isArticleExist(request.body.comment.articleId)){
    const newComment = {
    id: database.nextCommentId++,//add to the comment id and set it
    body: request.body.comment.body,
    username: request.body.comment.username,
    articleId: request.body.comment.articleId,
    upvotedBy: [],
    downvotedBy: []
    };
    //database.
    response.body = {comment:newComment};
    response.status = 201;
    database.comments[newComment.id] = newComment;//adds the comment to the comment database
    database.users[newComment.username].commentIds.push(newComment.id);//link the comment to the user
    database.articles[newComment.articleId].commentIds.push(newComment.id);//link the comment to the article

  } else {
    response.status = 400;
  }
  return response;
}

function isCommentExist(commentId) {
  if(database.comments[commentId]) {
    return true;
  } else {
    return false;
  }
}

function updateComment(url, request) {
  //get the id, current comment, and updated comment + create response
  const id = Number(url.split('/').filter(segment => segment)[1]);
  const savedComment = database.comments[id];
  const requestComment = request.body && request.body.comment;
  const response = {};
  console.log("request: ",request);

  //checks if the requested updated comment is valid
  if (!id || !requestComment) {
    response.status = 400;
  } else if (!savedComment) {//checks if the comment that they want to update is there or not
    response.status = 404;
  } else {
    //updates the comment
    savedComment.body = requestComment.body || savedComment.body;
    //updates the response
    response.body = {comment: savedComment};
    response.status = 200;
  }

  return response;


}

function deleteComment(url, request) {
  //get the comment id
  const id = Number(url.split('/').filter(segment => segment)[1]);
  //get the comment (if it exists)
  const savedComment = database.comments[id];
  const response = {};
  //check if the id and the comment are legit
  if (!id || !savedComment) {
    response.status = 404;//not legit
  } else {
    //variablea that will be used for setting/getting
    const commentUser = database.comments[id].username;
    const commentArticle = database.comments[id].articleId;

    //creates variable to store all the user's comments
    const userComments = database.users[commentUser].commentIds
    //removes the particular comment from that user
    userComments.splice(userComments.indexOf(id),1);//[id].splic=null;
    //creates varivale to store all the comments of the article
    const articleComments = database.articles[commentArticle].commentIds
    //removes that particualr comment from the article
    articleComments.splice(articleComments.indexOf(id),1);//[id]=null;
    //deletes the comment from the db
    database.comments[id] = null;
    //response status
    response.status = 204;

  }

  return response;

}


//method for up voting comments
function upVoteComment(url, request) {
  //get the id and the username and the comment
  const id = Number(url.split('/').filter(segment => segment)[1]);
  const username = request.body && request.body.username;
  let savedComment = database.comments[id];
  //set the response
  const response = {};
  //checks if the comment and username are legit
  if (savedComment && database.users[username]) {
    //calls the existing upvote method
    savedComment = upvote(savedComment, username);
    //returns the response body and status
    response.body = {comment: savedComment};
    response.status = 200;
  } else {//not a legit request
    response.status = 400;
  }

  return response;
}

//method for down voting comments
function downVoteComment(url, request) {
  //get the id and the username and the comment
  const id = Number(url.split('/').filter(segment => segment)[1]);
  const username = request.body && request.body.username;
  let savedComment = database.comments[id];
  //set the response
  const response = {};
  //checks if the comment and username are legit
  if (savedComment && database.users[username]) {
    //calls the existing downvote method
    savedComment = downvote(savedComment, username);
    //returns the response body and status
    response.body = {comment: savedComment};
    response.status = 200;
  } else {//not a legit request
    response.status = 400;
  }

  return response;
}

// Write all code above this line.

const http = require('http');
const url = require('url');

const port = process.env.PORT || 4000;
const isTestMode = process.env.IS_TEST_MODE;

const requestHandler = (request, response) => {
  const url = request.url;
  const method = request.method;
  const route = getRequestRoute(url);

  if (method === 'OPTIONS') {
    var headers = {};
    headers["Access-Control-Allow-Origin"] = "*";
    headers["Access-Control-Allow-Methods"] = "POST, GET, PUT, DELETE, OPTIONS";
    headers["Access-Control-Allow-Credentials"] = false;
    headers["Access-Control-Max-Age"] = '86400'; // 24 hours
    headers["Access-Control-Allow-Headers"] = "X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept";
    response.writeHead(200, headers);
    return response.end();
  }

  response.setHeader('Access-Control-Allow-Origin', null);
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.setHeader(
      'Access-Control-Allow-Headers', 'X-Requested-With,content-type');

  if (!routes[route] || !routes[route][method]) {
    response.statusCode = 400;
    return response.end();
  }

  if (method === 'GET' || method === 'DELETE') {
    const methodResponse = routes[route][method].call(null, url);
    !isTestMode && (typeof saveDatabase === 'function') && saveDatabase();

    response.statusCode = methodResponse.status;
    response.end(JSON.stringify(methodResponse.body) || '');
  } else {
    let body = [];
    request.on('data', (chunk) => {
      body.push(chunk);
    }).on('end', () => {
      body = JSON.parse(Buffer.concat(body).toString());
      const jsonRequest = {body: body};
      const methodResponse = routes[route][method].call(null, url, jsonRequest);
      !isTestMode && (typeof saveDatabase === 'function') && saveDatabase();

      response.statusCode = methodResponse.status;
      response.end(JSON.stringify(methodResponse.body) || '');
    });
  }
};
//need these for loading and saving the database
const yaml = require('js-yaml');
const fs = require('fs');
//Reads a yaml file and returns am object that is the db
function loadDatabase() {
//try catch statement for error handling
  try {
    //loads the yaml file
    const config = yaml.safeLoad(fs.readFileSync('./db.yml', 'utf8'));
    return config;
  } catch (e) {//error handling
    console.log(e);
  }
}

function saveDatabase() {
  //converts the db into a yaml file
  const yamlfile = yaml.safeDump (database, {
    'styles': {
      '!!null': 'canonical' // dump null as ~
    },
    'sortKeys': true        // sort object keys
  });
  //writes the yaml file to the db.yml
  fs.writeFile("./db.yml", yamlfile, function(err) {
  if(err) {//error handling
      return console.log(err);
  }
})
}


const getRequestRoute = (url) => {
  const pathSegments = url.split('/').filter(segment => segment);

  if (pathSegments.length === 1) {
    return `/${pathSegments[0]}`;
  } else if (pathSegments[2] === 'upvote' || pathSegments[2] === 'downvote') {
    return `/${pathSegments[0]}/:id/${pathSegments[2]}`;
  } else if (pathSegments[0] === 'users') {
    return `/${pathSegments[0]}/:username`;
  } else {
    return `/${pathSegments[0]}/:id`;
  }
}

if (typeof loadDatabase === 'function' && !isTestMode) {
  const savedDatabase = loadDatabase();
  if (savedDatabase) {
    for (key in database) {
      database[key] = savedDatabase[key] || database[key];
    }
  }
}

const server = http.createServer(requestHandler);

server.listen(port, (err) => {
  if (err) {
    return console.log('Server did not start succesfully: ', err);
  }

  console.log(`Server is listening on ${port}`);
});
