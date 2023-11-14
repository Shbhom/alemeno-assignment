# Credit Approval System

This project aims to create a credit approval system utilizing past data and future transactions. The system is built on the Typescript/NodeJS stack and incorporates background tasks. The application exposes several API endpoints with robust error handling, appropriate status codes, and follows best practices for REST APIs. Additionally, the entire application and its dependencies are containerized using Docker.

## Note:
The code for the endpoint to ingest Data from excel sheet to DB will throw error as the provided loan_data.xlsx contains duplicate loan_ids

## Getting Started

1. Run the following command to clone the repo locally and then cd into the directory.

```shell
git clone https://github.com/Shbhom/alemeno-assignment.git
cd alemeno-assignment

```

2. insert values in the .env-db and .env-backend

3. run the docker-compose.yaml file using 

```shell
    docker-compose up -d;
```


Access the application at http://localhost:5500 or the port mentioned in the .env-backed.

