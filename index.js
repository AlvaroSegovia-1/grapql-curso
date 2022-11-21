import { gql } from "apollo-server";
import { ApolloServer, UserInputError } from "apollo-server";
import { v1 as uuid } from "uuid";

const persons = [
  {
    name: "Midu",
    phone: "034-123456",
    street: "Calle Fronteded",
    city: "Barcelona",
    id: "3d594650-343611e9-bc57-8b88ba54c431",
  },
  {
    name: "Marcos",
    phone: "044-123456",
    street: "Av. FullStack",
    city: "Mataro",
    id: "3d594650-343611e9-bc57-8b88ba54c431",
  },
  {
    name: "Itzi",
    street: "Pasaje Testing",
    city: "Ibiza",
    id: "3d594650-343611e9-bc57-8b88ba54c431",
  },
];

const typeDefinitions = gql`
  type Address {
    street: String!
    city: String!
  }

  type Person {
    name: String!
    phone: String
    address: Address!
    id: ID!
  }

  type Query {
    personCount: Int!
    allPersons: [Person]!
    findPerson(name: String!): Person
  }

  type Mutation {
    addPerson(
      name: String!
      phone: String
      street: String!
      city: String!
    ): Person
  }
`;

const resolvers = {
  Query: {
    personCount: () => persons.length,
    allPersons: () => persons,
    findPerson: (root, args) => {
      const { name } = args;
      return persons.find(persons => persons.name === name);
    },
  },
  Mutation: {
    addPerson: (root, args) => {
      if (persons.find(p => p.name === args.name)) {
        throw new UserInputError("Name must be unique", {
          invalidArgs: args.name,
        });
      }
      // const {name, phone, street, city} = args
      const person = { ...args, id: uuid() };
      persons.push(person);
      return person;
    },
  },
  Person: {
    address: root => {
      return {
        street: root.street,
        city: root.city,
      };
    },
  },
};

const server = new ApolloServer({
  typeDefs: typeDefinitions,
  resolvers,
});

server.listen().then(({ url }) => {
  console.log(`Server ready at ${url}`);
});
