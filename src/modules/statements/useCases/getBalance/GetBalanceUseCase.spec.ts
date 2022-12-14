import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";
import { AuthenticateUserUseCase } from "../../../users/useCases/authenticateUser/AuthenticateUserUseCase";
import { CreateUserUseCase } from "../../../users/useCases/createUser/CreateUserUseCase";
import { ICreateUserDTO } from "../../../users/useCases/createUser/ICreateUserDTO";
import { OperationType } from "../../entities/Statement";
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository";
import { CreateStatementUseCase } from "../createStatement/CreateStatementUseCase";
import { GetBalanceError } from "./GetBalanceError";
import { GetBalanceUseCase } from "./GetBalanceUseCase";

let getBalanceUseCase: GetBalanceUseCase;
let inMemoryStatementsRepository: InMemoryStatementsRepository;
let inMemoryUsersRepository: InMemoryUsersRepository;
let createUserUseCase: CreateUserUseCase;
let authenticateUserUseCase: AuthenticateUserUseCase;
let createStatementUseCase: CreateStatementUseCase;

describe("Get the balance", () => {
  beforeEach(() => {
    inMemoryStatementsRepository = new InMemoryStatementsRepository();
    inMemoryUsersRepository = new InMemoryUsersRepository();
    getBalanceUseCase = new GetBalanceUseCase(inMemoryStatementsRepository, inMemoryUsersRepository);
    createUserUseCase = new CreateUserUseCase(inMemoryUsersRepository);
    authenticateUserUseCase = new AuthenticateUserUseCase(inMemoryUsersRepository);
    createStatementUseCase = new CreateStatementUseCase(inMemoryUsersRepository, inMemoryStatementsRepository);
  });

  it("Should be able to get the user account balance.", async () => {
    const user1 = await createUserUseCase.execute({
      name: "paul",
      email: "paul@email.com",
      password: "1234"
    });

    const user2 = await createUserUseCase.execute({
      name: "jhon",
      email: "jhon@email.com",
      password: "1234"
    });

    await createStatementUseCase.execute({
      user_id: user1.id as string,
      type: OperationType.DEPOSIT,
      amount: 200,
      description: "Depositing 200 R$.",
    });

    await createStatementUseCase.execute({
      user_id: user1.id as string,
      type: OperationType.WITHDRAW,
      amount: 30,
      description: "Withdrawing 30 R$.",
    });

    await createStatementUseCase.execute({
      user_id: user2.id as string,
      sender_id: user1.id as string,
      type: OperationType.TRANSFER,
      amount: 50,
      description: "Transfer 50 R$ to user 2.",
    });

    await createStatementUseCase.execute({
      user_id: user2.id as string,
      type: OperationType.DEPOSIT,
      amount: 100,
      description: "Depositing 100 R$.",
    });

    await createStatementUseCase.execute({
      user_id: user1.id as string,
      sender_id: user2.id as string,
      type: OperationType.TRANSFER,
      amount: 100,
      description: "Transfer 100 R$ to user 1.",
    });

    const result = await getBalanceUseCase.execute({
      user_id: user1.id as string
    });

    expect(result).toHaveProperty("balance");
    expect(result.balance).toBeGreaterThan(0);
  });

  it("Should not be able to get the account balance from an inexistent user.", () => {
    expect(async () => {
      await getBalanceUseCase.execute({
        user_id: "NotExistsID"
      });
    }).rejects.toBeInstanceOf(GetBalanceError);
  });
});
