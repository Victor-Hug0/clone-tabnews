import email from "infra/email.js";
import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

describe("infra/email.js", () => {
  test("send()", async () => {
    await orchestrator.deleteAllEmails();
    await email.send({
      from: "Fintab <contato@example.com>",
      to: "teste@example.com",
      subject: "Teste de assunto",
      text: "Teste de corpo",
    });

    const lastEmail = await orchestrator.getLastEmail();

    expect(lastEmail.sender).toBe("<contato@example.com>");
    expect(lastEmail.recipients[0]).toBe("<teste@example.com>");
    expect(lastEmail.subject).toBe("Teste de assunto");
    expect(lastEmail.text).toBe("Teste de corpo\n");
  });
});
