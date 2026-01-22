test("GET to /api/v1/status should return 200", async () => {
    const response = await fetch(`http://localhost:3000/api/v1/status`);
    expect(response.status).toBe(200);

    const responseBody = await response.json();
    expect(responseBody.updated_at).toBeDefined();
    expect(responseBody.dependencies.database.db_version).toBeDefined();
    expect(responseBody.dependencies.database.max_connections).toBeDefined();
    expect(responseBody.dependencies.database.current_connections).toBeDefined();

    const parsedUpdatedAt = new Date(responseBody.updated_at);
    expect(responseBody.updated_at).toEqual(parsedUpdatedAt.toISOString());

    expect(typeof responseBody.dependencies.database.db_version).toBe("string");
    expect(typeof responseBody.dependencies.database.max_connections).toBe("number");
    expect(typeof responseBody.dependencies.database.current_connections).toBe("number");

    expect(responseBody.dependencies.database.db_version).toEqual("16.0");

    expect(responseBody.dependencies.database.max_connections).toEqual(100);
    expect(responseBody.dependencies.database.current_connections).toEqual(1);
});