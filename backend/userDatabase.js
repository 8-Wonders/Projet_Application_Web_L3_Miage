const User = require('./models/User');

async function getAllUsers() {
  try {
    return await User.find().select('-password');
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    return [];
  }
}

async function findUserByUsername(username) {
  try {
    return await User.findOne({ username });
  } catch (error) {
    console.error('Erreur lors de la recherche d\'utilisateur:', error);
    return null;
  }
}

async function findUserById(id) {
  try {
    return await User.findById(id).select('-password');
  } catch (error) {
    console.error('Erreur lors de la recherche d\'utilisateur par ID:', error);
    return null;
  }
}

async function addUser(userData) {
  try {
    const user = new User(userData);
    return await user.save();
  } catch (error) {
    console.error('Erreur lors de l\'ajout d\'un utilisateur:', error);
    throw error;
  }
}

async function deleteUser(id) {
  try {
    await User.findByIdAndDelete(id);
    return true;
  } catch (error) {
    console.error('Erreur lors de la suppression d\'un utilisateur:', error);
    throw error;
  }
}

module.exports = {
  getAllUsers,
  findUserByUsername,
  findUserById,
  addUser,
  deleteUser
};
