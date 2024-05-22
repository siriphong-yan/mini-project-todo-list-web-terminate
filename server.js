const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const app = express();
const port = 3001;

app.use(function(req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', true);
  next();
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const _createPool = () => {
    return mysql.createPool({
        host: 'localhost',
        user: 'root',
        database: 'todoDB',
        port: 3306,
        password: '12345678',
    });
}

app.get('/api/task', (req, res) => {
  try{
      const pool = _createPool();
      pool.getConnection(async function (err, connection) {
          if (err instanceof Error) {
              console.log(err);
              return res.status(500).send("internal error");
          }
          let whereCon = '';
          let values = new Array();
          if(req.query?.today){
            whereCon += ' AND DATE_FORMAT(task.task_date, "%Y-%m-%d") = ?';
            const dataNow = new Date();
            const monthValue = dataNow.getMonth()+1;
            values.push(`${dataNow.getFullYear()}-${(monthValue<10?'0':'')+monthValue}-${dataNow.getDate()}`);

            /* await connection.execute(
              `
              
              `,

            ) */
          }
          connection.query(
              `
              SELECT 
                task.task_id taskId,
                task.task_name taskName,
                task.task_desc taskDesc,
                task.task_bg_color taskBgColor,
                task.task_date taskDate,
                task.user_id userId,
                task.tast_status_id taskStatusId,
                ts.task_status_name taskStatusName,
                ts.task_status_color taskStatusColor
              from task task 
              left join task_status ts on (task.tast_status_id = ts.task_status_id)
              WHERE 1=1
                  ${whereCon}
                `, 
              values, 
              (err, rows, fields) => {
                  if (err) return res.status(500).send("internal error");
                  res.json(rows);
              }
          ); 
          
          connection.release();
      });
  }catch(_){
      res.status(500).send("internal error");
  }
});

app.post('/api/create-task', (req, res) => {
  try{
      const taskBgColor = req.body?.taskBgColor;
      const taskDate = req.body?.taskDate;
      const taskDesc = req.body?.taskDesc;
      const taskName = req.body?.taskName;

      if(taskBgColor && taskDate && taskDesc && taskName){
          const pool = _createPool();
          pool.getConnection(function (err, connection) {
              if (err instanceof Error) {
                  return res.status(500).send("internal error");
              }

              let values = new Array();
              values.push(taskName);
              values.push(taskDesc);
              values.push(taskBgColor);
              values.push(`${taskDate} 01:00:00`);
              values.push(1);
              values.push(1);

              connection.execute(`INSERT into task (task_name, task_desc, task_bg_color, task_date, user_id, tast_status_id) VALUES (?, ?, ?, ?, ?, ?)`, values, (err, result, fields) => {
                  if (err instanceof Error) {
                    return res.status(500).send("internal error");
                  }
                
                  res.send({ message:"Success" })
              });
              
              connection.release();
          });
      }else{
          res.status(400).send("Bad Request");
      }
  }catch(_){
      res.status(500).send("internal error");
  }
})

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
