import mysql from "mysql2/promise";
import axios from "axios";

const fetchData = async () => {
  try {
    console.log("Fething data from API");
    const response = await axios.get(
      "https://exercisedb.p.rapidapi.com/exercises?limit=100&offset=0",
      {
        headers: {
          "X-RapidAPI-Key":
            "3c274ac23dmshb0612032282a97fp13242bjsn73e88b4c7cfd",
          "X-RapidAPI-Host": "exercisedb.p.rapidapi.com",
        },
      }
    );
    console.log("Data fetched successfully");

    return response.data;
  } catch (error) {
    console.error("Error fetching data:", error);
    return null;
  }
};
const createTables = async (connection: any) => {
  const createExercisesTable = `
    CREATE TABLE IF NOT EXISTS Exercises (
      id VARCHAR(10) PRIMARY KEY,
      bodyPart VARCHAR(50),
      equipment VARCHAR(50),
      gifUrl VARCHAR(255),
      name VARCHAR(100),
      target VARCHAR(50),
      secondaryMuscles JSON,
      instructions JSON
    );
  `;

  await connection.execute(createExercisesTable);
};

const insertData = async () => {
  const exercises = await fetchData();

  if (!exercises) {
    console.error("No data fetched");
    return;
  }

  const connection = await mysql.createConnection({
    host: "",
    port: 3306,
    user: "webapp",
    password: "",
    database: "employee",
  });

  try {
    await connection.beginTransaction();

    // Ensure the table is created
    await createTables(connection);

    console.log("Inserting data in DB");

    for (const exercise of exercises) {
      const [result] = await connection.execute(
        `INSERT INTO Exercises (id, bodyPart, equipment, gifUrl, name, target, secondaryMuscles, instructions)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
         bodyPart = VALUES(bodyPart),
         equipment = VALUES(equipment),
         gifUrl = VALUES(gifUrl),
         name = VALUES(name),
         target = VALUES(target),
         secondaryMuscles = VALUES(secondaryMuscles),
         instructions = VALUES(instructions)`,
        [
          exercise.id,
          exercise.bodyPart,
          exercise.equipment,
          exercise.gifUrl,
          exercise.name,
          exercise.target,
          JSON.stringify(exercise.secondaryMuscles || []),
          JSON.stringify(exercise.instructions || []),
        ]
      );
    }

    await connection.commit();
    console.log("Data inserted successfully. (Table: Exercises)");
  } catch (error) {
    await connection.rollback();
    console.error("Error inserting data:", error);
  } finally {
    await connection.end();
  }
};

insertData();
