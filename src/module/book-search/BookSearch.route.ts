import express from 'express'
import { IRoute } from '@app/routes/route.interface'
import BookSearchController from '@app/module/book-search/BookSearch.controller'
import BookSearchValidator from './BookSearch.validator'

const router = express.Router()

router.get('/search', BookSearchValidator.searchBooks, BookSearchController.searchBooks)
router.get('/search/by-author', BookSearchValidator.searchBooks, BookSearchController.searchBooksByAuthor)

export default {
    router,
    path: 'book-search',
} as IRoute
