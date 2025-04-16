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
       
        const categoryId=req.params.id
        const category=await Category.findById(categoryId)
       
        

        res.render('admin/editCategory',{category})
    } catch (error) {
        console.log('error from loadEditCategory',error);
        res.status(500).send('Internal Server Error');
    }
}

const editCategory = async (req, res) => {
    try {
      const { categoryName } = req.body;
      const categoryId = req.params.id;
  
      const existingCategory = await Category.findOne({ name: categoryName });
      if (existingCategory && existingCategory._id.toString() !== categoryId) {
        return res.status(400).json({ error: 'Category with this name already exists' });
      }
  
      await Category.findByIdAndUpdate(categoryId, { name: categoryName });
      res.redirect('/admin/categories'); 
    } catch (error) {
      console.error('Error updating category:', error);
      res.status(500).send('Server Error');
    }
  };
    

const addingCategory = async (req, res) => {
    try {
        const { cName } = req.body;
  

        const existingCategory = await Category.findOne({ name: { $regex: new RegExp(`^${cName}$`, 'i') } }); // Case-insensitive check

        if (existingCategory) {
            return res.status(400).json({ message: 'Category with the same name already exists' });
        }

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

        res.status(200).send('Category permanently deleted');

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