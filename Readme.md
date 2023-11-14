# Credit Approval System

This project aims to create a credit approval system utilizing past data and future transactions. The system is built on the Typescript/NodeJS stack and incorporates background tasks. The application exposes several API endpoints with robust error handling, appropriate status codes, and follows best practices for REST APIs. Additionally, the entire application and its dependencies are containerized using Docker.

## Note:
The code for the endpoint to ingest Data from excel sheet to DB will throw error as the provided loan_data.xlsx contains duplicate loan_ids

## Getting Started

1. Run the following command to clone the repo locally and then cd into the directory.

```shell
git clone https://github.com/Shbhom/alemeno-assignment.git
cd alemeno-assignment
npm install -g pnpm
```

leave installation command for pnpm if already installed


2. insert values in the .env-db and .env-backend

3. run the docker-compose.yaml file using 

```shell
    docker-compose up -d;
```

4. cd to app directory and create a .env file and store the
    DB_URL="postgres-connection-string"

5. Instead of using postgres the service as hostname for DB_URL use localhost to push migrations to the database.

6. run  to create migrations and then to push those migrations to the DB.
```shell
    pnpm generate
    pnpm push
```

5. Now in the .env file inside the app directory change the hostname back to postgres

6. And restart the container by running 
```shell
    docker-compose down 
    docker-compose up -d
```

we need this restart due to change in env variables since server needs to restarted when env vars are changed


Access the application at http://localhost:5500 or the port mentioned in the .env-backed.

