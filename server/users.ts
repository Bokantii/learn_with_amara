export interface DummyUser {
  id: string;
  email: string;
  password: string;
  name: string;
}

export const dummyUsers: DummyUser[] = [
  {
    id: "1",
    email: "demo@iclp.com",
    password: "demo1234",
    name: "Demo Student",
  },
];
