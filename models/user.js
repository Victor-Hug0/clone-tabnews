import database from "infra/database.js";

async function create(userData) {
    const result = await database.query({
        text: `
            INSERT INTO users (username, email, password)
            VALUES ($1, $2, $3)
            RETURNING *
        `,
        values: [userData.username, userData.email, userData.password],
    });
    return result.rows[0];
}

const user = {
    create,
};

export default user;