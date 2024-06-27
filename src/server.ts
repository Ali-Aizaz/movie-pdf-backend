// src/server.ts
import express, { Request, Response } from 'express';
import {
  generatePopularMoviesPdf,
  generateMovieDetailPdf,
} from './pdfGenerator';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
app.get('/movies', async (req: Request, res: Response) => {
  try {
    const pdfBuffer = await generatePopularMoviesPdf();
    res.setHeader('Content-Type', 'application/pdf');
    res.send(pdfBuffer);
  } catch (error) {
    // console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/movies/:id', async (req: Request, res: Response) => {
  try {
    const pdfBuffer = await generateMovieDetailPdf(req.params.id);
    res.setHeader('Content-Type', 'application/pdf');
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).send('Internal Server Error');
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
