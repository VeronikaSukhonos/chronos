import Test from '../models/test';

export async function getAll(req, res) {
  try {
    const result = await Test.find(); // returns an array of all objects
    return res.status(200).json({
      status: true,
      data: result
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: false,
      error: err
    });
  }
}
export async function getOne(req, res) {
  try {
    const result = await Test.findOne({ _id: req.params.test }); // returns founded object
    return res.status(200).json({
      status: true,
      data: result
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: false,
      error: err
    });
  }
}
export async function createOne(req, res) {
  const title = req.body ? req.body.title : undefined;
  try {
    const result = await Test.create({ title }); // returns newly created object
    return res.status(201).json({
      status: true,
      data: result
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: false,
      error: err
    });
  }
}
export async function updateOne(req, res) {
  const title = req.body ? req.body.title : undefined;
  try {
    const result = await Test.findOneAndUpdate({ _id: req.params.test }, { title }); // returns updated object before changes
    return res.status(200).json({
      status: true,
      data: result
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: false,
      error: err
    });
  }
}
export async function deleteOne(req, res) {
  try {
    const result = await Test.deleteOne({ _id: req.params.test }); // returns object like { acknowledged: true, deletedCount: 1 }
    return res.status(200).json({
      status: true,
      data: result
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: false,
      error: err
    });
  }
}
