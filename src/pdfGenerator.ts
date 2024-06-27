import axios from 'axios';
import { PDFDocument, PDFPage, PDFString, StandardFonts, rgb } from 'pdf-lib';
import dotenv from 'dotenv';

dotenv.config();

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

const createPageLinkAnnotation = (
  page: PDFPage,
  uri: string,
  rect: [number, number, number, number],
) =>
  page.doc.context.register(
    page.doc.context.obj({
      Type: 'Annot',
      Subtype: 'Link',
      Rect: rect,
      Border: [0, 0, 2],
      C: [0, 0, 1],
      A: {
        Type: 'Action',
        S: 'URI',
        URI: PDFString.of(uri),
      },
    }),
  );

export const generatePopularMoviesPdf = async (): Promise<Buffer> => {
  const response = await axios.get(`${TMDB_BASE_URL}/movie/popular`, {
    params: { api_key: TMDB_API_KEY },
  });

  const movies = response.data.results;

  const pdfDoc = await PDFDocument.create();
  const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);

  const page = pdfDoc.addPage();
  const { height } = page.getSize();
  const fontSize = 12;

  let yPosition = height - fontSize * 2;
  for (const movie of movies) {
    const linkText = movie.title;
    const text = ` (Release Date: ${movie.release_date}, Rating: ${movie.vote_average})`;

    // Adding the link text
    page.drawText(linkText, {
      x: 50,
      y: yPosition,
      size: fontSize,
      font: timesRomanFont,
      color: rgb(0, 0, 1),
    });

    // Calculate the width of the link text
    const linkWidth = timesRomanFont.widthOfTextAtSize(linkText, fontSize);

    // Add annotation for hyperlink
    const link = createPageLinkAnnotation(
      page,
      `http://localhost:${process.env.PORT}/movies/${movie.id}`,
      [50, yPosition - 2, 50 + linkWidth, yPosition + fontSize],
    );

    page.node.addAnnot(link);

    // Adding the rest of the text
    page.drawText(text, {
      x: 50 + linkWidth,
      y: yPosition,
      size: fontSize,
      font: timesRomanFont,
      color: rgb(0, 0, 0),
    });

    yPosition -= fontSize * 2;
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
};

export const generateMovieDetailPdf = async (
  movieId: string,
): Promise<Buffer> => {
  const response = await axios.get(`${TMDB_BASE_URL}/movie/${movieId}`, {
    params: { api_key: TMDB_API_KEY },
  });

  const movie = response.data;

  const pdfDoc = await PDFDocument.create();
  const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);

  const page = pdfDoc.addPage();
  const { height } = page.getSize();
  const fontSize = 12;

  const posterUrl = `https://image.tmdb.org/t/p/w500${movie.poster_path}`;
  const posterResponse = await axios.get(posterUrl, {
    responseType: 'arraybuffer',
  });
  const posterImage = await pdfDoc.embedJpg(posterResponse.data);
  const posterDims = posterImage.scale(0.5);

  page.drawText(`Title: ${movie.title}`, {
    x: 50,
    y: height - fontSize * 2,
    size: fontSize,
    font: timesRomanFont,
    color: rgb(0, 0, 0),
  });

  page.drawText(`Release Date: ${movie.release_date}`, {
    x: 50,
    y: height - fontSize * 4,
    size: fontSize,
    font: timesRomanFont,
    color: rgb(0, 0, 0),
  });

  page.drawText(`Rating: ${movie.vote_average}`, {
    x: 50,
    y: height - fontSize * 6,
    size: fontSize,
    font: timesRomanFont,
    color: rgb(0, 0, 0),
  });

  page.drawImage(posterImage, {
    x: 50,
    y: height - posterDims.height - fontSize * 8,
    width: posterDims.width,
    height: posterDims.height,
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
};
