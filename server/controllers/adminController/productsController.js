const Category=require('../../models/admin/categoryModel')
const Product = require('../../models/admin/productModel')
const categoryOffer=require('../../models/admin/categoryOfferModel')
const fs = require('fs');
const path = require('path');

const loadProduct = async (req, res) => {
    try {
        const limit = 4; 
        const page = parseInt(req.query.page) || 1;
        
        const totalProducts = await Product.countDocuments(); 
        const totalPages = Math.ceil(totalProducts / limit); 
        const products = await Product.find()
            .populate('category')
            .skip((page - 1) * limit) 
            .limit(limit);

        res.render('admin/products', { 
            products, 
            currentPage: page, 
            totalPages 
        });
    } catch (error) {
        console.log('Error from loadProduct', error);
        res.status(500).send("Server error");
    }
};


const addProducts=async (req,res) => {
    try {
        const categories = await Category.find({status:'Active'})     
        res.render('admin/addProduct',{categories})
    } catch (error) {
        console.log('Error from addproduct',error);
        
    }
}

const uploadProducts = async (req,res)=>{
    try {
                 
        if (!req.files || req.files.length===0) {
            return res.status(400).json({message:'No files uploaded'})
        }

        const images=req.files.map(file=>file.filename)
        console.log('Processed Image',images);

        const {name,description,categoryId,price,stock,specification,discountprice}=req.body
           console.log('catt  body',categoryId);

        const categoryDiscountOffer = await categoryOffer.findOne({categoryId:categoryId});
           
        const newProduct=new Product({
            name,description,category:categoryId,price,stock,specification,discountprice,image:images,categoryOfferamount:categoryDiscountOffer

        })
        await newProduct.save()
        console.log('product save after the add product',newProduct);
        

        res.status(200).json({message:'Product added successfully',newProduct})
        
        // res.render('admin/products')
    } catch (error) {
        console.log("error in uploadProduct", error)
        res.status(400).json({message:'Internal server error',error:error.message})
    }
}


const loadEditProduct=async (req,res) => {
    try {
        const productId=req.params.id
        // console.log(productId,);
        
     const product=await Product.findById(productId).populate('category')
    //  console.log(product,'-----');
     
        
    product.category
    // console.log(product.category);

        const categories=await Category.find()
    // console.log("categot",categories);

        res.render('admin/editProduct',{product,categories})
    } catch (error) {
        console.log('error from loadedit product',error);
        
    }
}

const editProduct = async (req, res) => {
    try {
       
        const productId = req.params.id;

        const existingProduct = await Product.findById(productId);
        if (!existingProduct) return res.status(404).json({ message: 'Product not found' });

        const newImages = req.files ? req.files.map(file => file.filename) : [];

        const { keepImages } = req.body;
        let updatedImages = keepImages ? JSON.parse(keepImages) : existingProduct.image;
      
        updatedImages = [...updatedImages, ...newImages];
        if (updatedImages.length<3) {
          return res.status(404).json({message:"You must upload at least 3 images."})
        }
        
        const {
            name, description, category, price, stock, specification, discountprice
        } = req.body;

        const updatedProduct = await Product.findByIdAndUpdate(
            productId,
            {
                $set: {
                    name,
                    description,
                    category,
                    price,
                    stock,
                    specification,
                    discountprice,
                    image: updatedImages 
                }
            },
            { new: true }
        );

        res.json({ message: 'Product updated successfully', updatedProduct });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ message: 'Error updating product', error });
    }
};


const removeImages = async (req, res) => {
    try {
        const { imageName } = req.body;
        const { id } = req.params;
        
        
        if (!imageName) {
            return res.status(400).json({ 
                success: false, 
                error: 'Image name is required' 
            });
        }

        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ 
                success: false, 
                error: 'Product not found' 
            });
        }

        product.image = product.image.filter(img => img !== imageName);

        await product.save();

        return res.status(200).json({
            success: true,
            message: 'Image deleted successfully',
            updatedImages: product.image
        });
        
    } catch (error) {
        console.error('Unexpected error in removeImages function:', error.message);
        return res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
};


const changeProductStatus = async (req, res) => {
    const { productId, action } = req.body;
    try {
        const product = await Product.findById(productId);
        
        if (!product) {
            return res.json({ success: false, message: 'Product not found' });
        }
        if (action === 'Block') {
            product.status = 'Blocked';
        } else if (action === 'Active') {
            product.status = 'Active';
        }

        await product.save();
        res.json({ success: true, status: product.status });
    } catch (error) {
        console.error('Error updating product status:', error);
        res.json({ success: false });
    }
};

const deleteProduct = async (req, res) => {
    const productId=req.params.id


    try {
        const deleteProduct=await Product.findByIdAndDelete(productId)

        if(!deleteProduct){
            return res.status(404).send('Product not found')
        }

     
        res.redirect('/admin/products')
        
    } catch (error) {
        console.error('Error to deleting product:',error)
        res.status(500).send('Server error')
    }
    
};




module.exports={
    loadProduct,
    addProducts,
    uploadProducts,
    editProduct,
    removeImages,
    loadEditProduct,
    changeProductStatus,
    deleteProduct,

}