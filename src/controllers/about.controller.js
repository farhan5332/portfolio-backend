import { About } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';

// GET /api/about  (public) - the single About document
export const getAbout = async (req, res) => {
  const about = await About.findOne();
  if (!about) throw new ApiError(404, 'About info has not been set up yet');

  res.json({ success: true, data: about });
};

// PUT /api/about  (admin) - updates the About document, creating it the first time
export const updateAbout = async (req, res) => {
  let about = await About.findOne();

  if (!about) {
    if (!req.body.name) throw new ApiError(400, 'Name is required the first time');
    about = new About();
  }

  about.set(req.body);
  await about.save();

  res.json({ success: true, message: 'About info updated', data: about });
};
