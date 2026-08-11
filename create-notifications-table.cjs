const mssql = require('./server/node_modules/mssql');
require('./server/node_modules/dotenv').config({ path: 'server/.env' });

const cfg = {
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: { encrypt: false, trustServerCertificate: true }
};

mssql.connect(cfg).then(pool => {
  return pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Notifications')
    BEGIN
      CREATE TABLE Notifications (
        id VARCHAR(50) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL FOREIGN KEY REFERENCES Users(id),
        type NVARCHAR(20) NOT NULL CHECK (type IN ('assigned', 'completed', 'overdue')),
        message NVARCHAR(500) NOT NULL,
        task_id VARCHAR(36) NULL,
        is_read BIT NOT NULL DEFAULT 0,
        created_at DATETIME2 DEFAULT GETUTCDATE()
      )
    END
  `);
}).then(() => {
  console.log('Notifications table created successfully');
  process.exit(0);
}).catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
