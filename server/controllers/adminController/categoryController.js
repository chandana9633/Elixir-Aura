const Category=require('../../models/admin/categoryModel')


const loadCategoty=async (req,res) => {
    try {
      const categoryData = await Category.find();
        res.render('admin/categories',{categoryData})
    } catch (error) {
        console.log('error from loadCategory',error);
    }
}

const loadEditCategery=async (req,res) => {
    try {
        console.log('inside edit page')
        const categoryId=req.params.id
        const category=await Category.findById(categoryId)
        console.log('caaattt',category);
        

        res.render('admin/editCategory',{category})
    } catch (error) {
        console.log('error from loadEditCategory',error);
        res.status(500).send('Internal Server Error');
    }
}

// Controller Function
const editCategory = async (req, res) => {
    try {
      const { categoryName } = req.body;
      const categoryId = req.params.id;
  
      // Check if a category with the new name already exists
      const existingCategory = await Category.findOne({ name: categoryName });
      if (existingCategory && existingCategory._id.toString() !== categoryId) {
        return res.status(400).json({ error: 'Category with this name already exists' });
      }
  
      // Update category name
      await Category.findByIdAndUpdate(categoryId, { name: categoryName });
      res.redirect('/admin/categories'); // Redirect to categories list page after update
    } catch (error) {
      console.error('Error updating category:', error);
      res.status(500).send('Server Error');
    }
  };
    

// const deleteCategory = async (req, res) => {
//     const categoryId = req.params.id; 
//     console.log('Category ID to delete:', categoryId);

//     try {
//         const deletedCategory = await Category.findByIdAndDelete(categoryId);

//         if (!deletedCategory) {
//             return res.status(404).send('Category not found');
//         }

//         console.log('Deleted Category:', deletedCategory); 
//         res.redirect('/admin/categories'); 

//     } catch (error) {
//         console.error('Error deleting category:', error);
//         res.status(500).send('Server error');
//     }
// };




const addingCategory = async (req, res) => {
    try {
        const { cName } = req.body;
        console.log('Request Body:', req.body);

        // Check if a category with the exact name already exists
        const existingCategory = await Category.findOne({ name: { $regex: new RegExp(`^${cName}$`, 'i') } }); // Case-insensitive check

        if (existingCategory) {
            return res.status(400).json({ message: 'Category with the same name already exists' });
        }

        // Proceed to add a new category since no exact match was found
        const newCategory = new Category({
            name: cName,
        });

        await newCategory.save();

        return res.status(200).json({ success: true });
    } catch (error) {
        console.log('Error:', error);
        return res.status(500).json({ error: 'Failed to add category' });
    }
};


// // category.controller.js

// // Soft delete the category by updating its status to 'Deleted'
// const deleteCategory = async (req, res) => {
//     const categoryId = req.params.id;

//     try {
//         const category = await Category.findById(categoryId);

//         if (!category) {
//             return res.status(404).send('Category not found');
//         }

//         // Soft delete by updating the status to 'Deleted'
//         category.status = 'Deleted';
//         await category.save();

//         res.redirect('/admin/categories');
//     } catch (error) {
//         console.error('Error deleting category:', error);
//         res.status(500).send('Server error');
//     }
// };

// Change the status of a category to either 'Blocked' or 'Active'
const changeCategoryStatus = async (req, res) => {
    const { categoryId, action } = req.body;

    try {
        const category = await Category.findById(categoryId);

        if (!category) {
            return res.json({ success: false, message: 'Category not found' });
        }

        if (action === 'Block') {
            category.status = 'Blocked';
        } else if (action === 'Active') {
            category.status = 'Active';
        }

        await category.save();
        res.json({ success: true, status: category.status });
    } catch (error) {
        console.error('Error updating category status:', error);
        res.json({ success: false });
    }
};



const deleteCategory = async (req, res) => {
    const categoryId = req.params.id;

    try {
        const deletedCategory = await Category.findByIdAndDelete(categoryId);

        if (!deletedCategory) {
            return res.status(404).send('Category not found');
        }

        console.log('Deleted Category:', deletedCategory);
        res.status(200).send('Category permanently deleted'); // Send success message after deletion

    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).send('Server error');
    }
};


module.exports={
    loadCategoty,
    addingCategory,
    loadEditCategery,
    editCategory,
    deleteCategory,
    changeCategoryStatus
    

}