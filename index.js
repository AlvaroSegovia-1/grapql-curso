import { gql } from "apollo-server";
import { ApolloServer, UserInputError } from "apollo-server";
import "./db.js";
import Person from "./models/persona.js";
import dotenv from "dotenv";
dotenv.config({ path: ".env" });
import User from "./models/user.js";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWTSECRETA;

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
  type User {
    username: String!
    friends: [Person]!
    id: ID!
  }
  type Token {
    value: String!
  }

  type Query {
    personCount: Int!
    allPersons(phone: YesNo): [Person]!
    findPerson(name: String!): Person
    me: User
  }

  type Mutation {
    addPerson(
      name: String!
      phone: String
      street: String!
      city: String!
    ): Person
    editNumber(name: String!, phone: String!): Person
    createUser(username: String!): User
    login(username: String!, password: String!): Token
    addAsFriend(name: String!): User
  }
`;

const resolvers = {
  Query: {
    //() => persons.length,
    personCount: () => Person.collection.countDocuments(),
    allPersons: async (root, args) => {
      if (!args.phone) return Person.find({});
      return Person.find({ phone: { $exists: args.phone === "YES" } });

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
    me: (root, args, context) => {
      return context.currentUser;
    },
  },
  Mutation: {
    addPerson: async (root, args, context) => {
      const person = new Person({ ...args });
      const { currentUser } = context;
      if (!currentUser) throw new AuthenticationError("No autenticado");
      try {
        await person.save();
        currentUser.friends = currentUser.friends.concat(person);
        await currentUser.save();
      } catch (error) {
        throw new UserInputError(error.message, {
          invalidArgs: args,
        });
      }
      return person;
    },

    editNumber: async (root, args) => {
      const person = await Person.findOne({ name: args.name });
      if (!person) return;

      person.phone = args.phone;
      return person.save();
    },
    createUser: (root, args) => {
      const user = new User({ username: args.username });
      return user.save().catch(error => {
        throw new UserInputError(error.message, {
          invalidArgs: args,
        });
      });
    },
    login: async (root, args) => {
      const user = await User.findOne({
        username: args.username,
      });
      if (!user || args.password != "20202020") {
        throw new UserInputError("credenciales erróneas");
      }
      const userForToken = {
        username: user.username,
        id: user._id,
      };
      return {
        value: jwt.sign(userForToken, JWT_SECRET),
      };
    },
    addAsFriend: async (root, args, context) => {
      const { currentUser } = context;
      if (!currentUser) throw new AuthenticationError("No autenticado");
      const person = await Person.findOne({ name: args.name });

      const noFriendlyAlready = person =>
        !currentUser.friends.map(p => p._id).includes(person._id);
      if (noFriendlyAlready(person)) {
        currentUser.friends = currentUser.friends.concat(person);
        await currentUser.save();
      }
      return currentUser;
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
  context: async ({ req }) => {
    const auth = req ? req.headers.authorization : null;
    if (auth && auth.toLowerCase().startsWith("bearer ")) {
      const token = auth.substring(7);
      const decodedToken = jwt.verify(token, JWT_SECRET);
      const currentUser = await User.findById(decodedToken.id).populate(
        "friends",
      );
      return { currentUser };
    }
  },
});

server.listen().then(({ url }) => {
  console.log(`Server ready at ${url}`);
});
