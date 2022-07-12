import express from 'express'
import expressGraphQL from 'express-graphql'

import {
    GraphQLSchema,
    GraphQLNonNull,
    GraphQLObjectType,
    GraphQLString,
    GraphQLList,
    GraphQLInt
} from 'graphql'

const authors = [
	{ id: 1, name: 'J. K. Rowling' },
	{ id: 2, name: 'J. R. R. Tolkien' },
	{ id: 3, name: 'Brent Weeks' }
]

const books = [
	{ id: 1, name: 'Harry Potter and the Chamber of Secrets', authorId: 1 },
	{ id: 2, name: 'Harry Potter and the Prisoner of Azkaban', authorId: 1 },
	{ id: 3, name: 'Harry Potter and the Goblet of Fire', authorId: 1 },
	{ id: 4, name: 'The Fellowship of the Ring', authorId: 2 },
	{ id: 5, name: 'The Two Towers', authorId: 2 },
	{ id: 6, name: 'The Return of the King', authorId: 2 },
	{ id: 7, name: 'The Way of Shadows', authorId: 3 },
	{ id: 8, name: 'Beyond the Shadows', authorId: 3 }
]

const app = express()

const AuthorType = new GraphQLObjectType({
    name: 'author',
    description: 'information about author',
    fields: () => ({
        id: { type: GraphQLNonNull(GraphQLInt)},
        name: { type: GraphQLNonNull(GraphQLString)},
        books: { 
            type: new GraphQLList(BookType),
            resolve:(author) => books.filter(book => book.authorId == author.id)
        } 
    })
})

const BookType = new GraphQLObjectType({
    name: 'book',
    description: 'book details',
    fields: () => ({
        id: { type: GraphQLNonNull(GraphQLInt)},
        name: { type: GraphQLNonNull(GraphQLString)},
        authorId: { type: GraphQLNonNull(GraphQLInt)},
        author: {
            type: AuthorType,
            resolve: (book) => {
                return authors.find( author => author.id === book.authorId )
            }
        },
    })
})

const RootQueryType = new GraphQLObjectType({
    name: 'Query',
    description: 'Root Query',
    fields: () => ({
        book: {
            type: BookType,
            description: 'book details',
            args: {
                id: {
                    type: GraphQLInt
                }
            },
            resolve: (parent, args) => books.find( book => book.id === args.id )
        },
        author: {
            type: AuthorType,
            description: 'author details',
            args: {
                id: {
                    type: GraphQLInt
                }
            },
            resolve: (parent, args) => authors.find( author => author.id === args.id )
        },
        books: {
            type: new GraphQLList(BookType),
            description: 'list of the books',
            resolve: () => books
        },
        authors: {
            type: new GraphQLList(AuthorType),
            description: 'list of the authors',
            resolve: () => authors
        }
    })
})

function addAuthor(authorName) {
    const newAuthor = {
        id: authors.length +1,
        name: authorName
    }
    authors.push(newAuthor)
    return newAuthor
}


const MutationQueryType = new GraphQLObjectType({
    name: 'Mutation',
    description: 'Mutation Query',
    fields: () => ({
        addBook: {
            type: BookType,
            description: 'add book',
            args: {
                name: { type: GraphQLNonNull(GraphQLString)},
                // authorId: { type: GraphQLNonNull(GraphQLInt)},
                author: new GraphQLObjectType({
                    name: 'addAuthor',
                    fields: () => ({
                        name:  {
                            type: GraphQLNonNull(GraphQLString)
                        }
                    })
                })
                    
            },
            resolve: (parent, args) => {
                let authorIndex = -1
                if(args.authorId) {
                    authorIndex = authors.findIndex( author => author.id === args.authorId )
                } else if(args.author && args.author.name) {
                    addAuthor(args.author.name)
                    authorIndex = authors.length -1
                }
                let newBook = undefined
                if(authorIndex > -1) {
                    newBook = {
                        id: books.length+1,
                        name: args.name,
                        authorId: authorIndex+1,
                        author: authors[authorIndex]
                    }
                    books.push(newBook)
                } else {
                    return {
                        error: "no author found for this book"
                    }
                }
                return newBook
            } 
        }
    })
})


const schema = new GraphQLSchema({
    query: RootQueryType,
    mutation: MutationQueryType
})



app.use('/graphql',expressGraphQL.graphqlHTTP({
    graphiql: true,
    schema: schema
}))

app.listen(5432., ()=>console.log('server is running'))
