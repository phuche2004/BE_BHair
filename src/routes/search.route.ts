import express from 'express';
import * as searchController from '../controllers/search.controller';

const router = express.Router();

router.get('/', searchController.searchShops);

export default router;
