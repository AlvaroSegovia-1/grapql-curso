import { gql } from "apollo-server";
import { ApolloServer, UserInputError } from "apollo-server";
import "./db.js";
import Person from "./models/persona.js";

/* const persons = [
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
]; */

const typeDefinitions = gql`
  enum YesNo {
    YES
    NO
  }

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
    allPersons(phone: YesNo): [Person]!
    findPerson(name: String!): Person
  }

  type Mutation {
    addPerson(
      name: String!
      phone: String
      street: String!
      city: String!
    ): Person
    editNumber(name: String!, phone: String!): Person
  }
`;

const resolvers = {
  Query: {
    //() => persons.length,
    personCount: () => Person.collection.countDocuments(),
    allPersons: async (root, args) => {
      // falta el filtro de phone
      return Person.find({});

      //  if (!args.phone) return persons;

      // const byPhone = person =>
      // args.phone === "YES" ? person.phone : !person.phone;
      // return persons.filter(byPhone);

      // return persons
      // .filter(person=> {
      //    return args.phone === "YES" ? person.phone : !person.phone
      // })
    },
    findPerson: (root, args) => {
      const { name } = args;
      //return persons.find(persons => persons.name === name);
      return Person.findOne({ name });
    },
  },
  Mutation: {
    addPerson: (root, args) => {
      const person = new Person({ ...args });
      return person.save();
    },
    editNumber: async (root, args) => {
      const person = await Person.findOne({ name: args.name });
      person.phone = args.phone;
      return person.save();
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
