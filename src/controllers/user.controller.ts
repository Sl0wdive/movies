import { registerUser, loginUser } from "../services/user.service";

export const userCreate = async (req, res) => {
  try {
    const token = await registerUser(req.body);
    res.status(201).json({ token, status: 1 });
  } catch (error) {
    res.status(500).json({ message: "Error creating user.", status: 0 });
  }
};

export const sessionCreate = async (req, res) => {
  try {
    const token = await loginUser(req.body);
    res.status(200).json({ token, status: 1 });
  } catch (error) {
    res.status(500).json({ message: "Error creating session.", status: 0 });
  }
};
