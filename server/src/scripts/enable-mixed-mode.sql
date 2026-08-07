-- Run this script in SSMS (Windows Authentication mode) to enable SQL Authentication
USE [master];
GO

-- 1. Enable Mixed Mode (SQL Server and Windows Authentication mode)
EXEC xp_instance_regwrite N'HKEY_LOCAL_MACHINE', N'Software\Microsoft\MSSQLServer\MSSQLServer', N'LoginMode', REG_DWORD, 2;
GO

-- 2. Ensure taskflow_user exists with sysadmin privileges
IF NOT EXISTS (SELECT name FROM sys.server_principals WHERE name = 'taskflow_user')
BEGIN
    CREATE LOGIN [taskflow_user] WITH PASSWORD = N'TaskFlowPass123!', DEFAULT_DATABASE = [master], CHECK_EXPIRATION = OFF, CHECK_POLICY = OFF;
    ALTER SERVER ROLE [sysadmin] ADD MEMBER [taskflow_user];
END
ELSE
BEGIN
    ALTER LOGIN [taskflow_user] WITH PASSWORD = N'TaskFlowPass123!', CHECK_EXPIRATION = OFF, CHECK_POLICY = OFF;
    ALTER LOGIN [taskflow_user] ENABLE;
END;
GO
