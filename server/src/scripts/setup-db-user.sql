-- Run this script in SSMS (New Query window) to set up database access
USE [master];
GO

-- 1. Enable SQL Server & Windows Authentication
EXEC sys.sp_MSsetdbbias;
GO

-- 2. Create taskflow_user login if it does not exist
IF NOT EXISTS (SELECT name FROM sys.server_principals WHERE name = 'taskflow_user')
BEGIN
    CREATE LOGIN [taskflow_user] WITH PASSWORD = N'TaskFlowPass123!', DEFAULT_DATABASE = [master], CHECK_EXPIRATION = OFF, CHECK_POLICY = OFF;
    ALTER SERVER ROLE [sysadmin] ADD MEMBER [taskflow_user];
    PRINT '✅ Created SQL user taskflow_user with sysadmin privileges.';
END
ELSE
BEGIN
    ALTER LOGIN [taskflow_user] WITH PASSWORD = N'TaskFlowPass123!', CHECK_EXPIRATION = OFF, CHECK_POLICY = OFF;
    ALTER LOGIN [taskflow_user] ENABLE;
    PRINT '✅ Updated taskflow_user password and enabled login.';
END;
GO

-- 3. Also enable sa account with standard password
ALTER LOGIN [sa] WITH PASSWORD = N'YourPassword123!', CHECK_EXPIRATION = OFF, CHECK_POLICY = OFF;
ALTER LOGIN [sa] ENABLE;
PRINT '✅ Enabled sa account with password.';
GO
