const express = require("express");

const { open } = require("sqlite");

const sqlite3 = require("sqlite3");

const path = require("path");

const dbPath = path.join(__dirname, "todoApplication.db");

const app = express();

app.use(express.json());

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log(
        "server started ad listening to the port http://localhost:3000/"
      );
    });
  } catch (error) {
    console.log(`database error ${error.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

//API 1
const hasStatusAndPriority = (requestQuery) => {
  return (
    requestQuery.status !== undefined && requestQuery.priority !== undefined
  );
};

const hasStatus = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasPriority = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

app.get("/todos/", async (request, response) => {
  let data = null;

  let getDataQuey = "";

  const { status, priority, search_q = "" } = request.query;

  switch (true) {
    case hasStatusAndPriority(request.query):
      getDataQuey = `select
             *
            from todo 
            where 
            todo Like '%${search_q}%'
            AND status='${status}'
            AND priority='${priority}'`;
      break;

    case hasStatus(request.query):
      getDataQuey = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND status ='${status}'`;

      break;

    case hasPriority(request.query):
      getDataQuey = `select
             *
            from todo 
            where 
            todo Like '%${search_q}%'
            AND priority='${priority}'`;

      break;

    default:
      getDataQuey = `select
             *
            from todo 
            where 
            todo Like '%${search_q}%'
            `;
      break;
  }
  data = await db.all(getDataQuey);
  response.send(data);
});

//API 2

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  console.log(todoId);

  const getDataQuery = `select * from todo where id=${todoId}`;

  const dataResponse = await db.get(getDataQuery);

  response.send(dataResponse);
});

//post api

app.post("/todos/", async (request, response) => {
  console.log(request.body);

  const { id, todo, priority, status } = request.body;

  const insertQuery = `

        insert into todo(id,todo,priority,status)

        values(${id},'${todo}','${priority}','${status}')
        `;

  await db.run(insertQuery);

  response.send("Todo Successfully Added");
});

// update api

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  let updateColumn = "";

  const requestBody = request.body;

  switch (true) {
    case requestBody.todo !== undefined:
      updateColumn = "Todo";

      break;

    case requestBody.priority !== undefined:
      updateColumn = "Priority";

      break;

    case requestBody.status !== undefined:
      updateColumn = "Status";

      break;
  }

  const getPreviousQuery = `select * from todo where id=${todoId}`;

  const previousQuery = await db.get(getPreviousQuery);

  const {
    todo = previousQuery.todo,
    status = previousQuery.status,
    priority = previousQuery.priority,
  } = request.body;

  const updateQuery = `
  update todo
  set
  todo='${todo}',
  status='${status}',
  priority='${priority}'`;

  await db.run(updateQuery);

  response.send(`${updateColumn} Updated`);
});

// delete api

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const deleteQuery = `delete from todo where id=${todoId}`;

  await db.run(deleteQuery);

  response.send("Todo Deleted");
});

module.exports = app;
