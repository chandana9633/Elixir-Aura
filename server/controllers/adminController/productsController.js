const Category=require('../../models/admin/categoryModel')
const Product = require('../../models/admin/productModel')
const fs = require('fs');
const path = require('path');

// const product=require('../../models/admin/productModel')

// const loadProduct=async (req,res) => {
//     try {
//         const product=await Product.find().populate('category')        
//         res.render('admin/products',{product})
//     } catch (error) {
//         console.log('Error from loadproduct',error)
//     }
// }


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


// const newArrivals = []
// const allProducts = []
// for (let i = product.length - 1; i >= 0; i--) {
//     if (newArrivals.length < 4) {
//         newArrivals.push(product[i])
//     } else {
//         allProduct.unshift(product[i])
//     }

// }

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
        console.log("------",req.body);
        console.log("---------",req.files);
          
        if (!req.files || req.files.length===0) {
            return res.status(400).json({message:'No files uploaded'})
        }

        const images=req.files.map(file=>file.filename)
        console.log('Processed Image',images);

        const {name,description,categoryId,price,stock,specification,discountprice}=req.body
           console.log('catt  body',categoryId);
           
        const newProduct=new Product({
            name,description,category:categoryId,price,stock,specification,discountprice,image:images

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
        // console.log('h==============================');
        const productId=req.params.id
        // console.log(productId,'=================');
        
     
        
     const product=await Product.findById(productId).populate('category')
    //  console.log(product,'-----------------------------');
     
        
    product.category
    // console.log(product.category);

        const categories=await Category.find()
    // console.log("categot",categories);

        // res.render('admin/editProduct',{product,categories})
        res.render('admin/editProduct',{product,categories})
    } catch (error) {
        console.log('error from loadedit product',error);
        
    }
}



//=====================================================
// const editProduct = async (req, res) => {
//     try {
//         console.log('edit product')
//         const productId = req.params.id;
//         // console.log('id',productId);

//         console.log('============',req.files);

//         const images=req.files.map(file=>file.filename)
//         console.log(image,'++++++++++++++++++++');
        
        
        
//         const {
//             name, description, category, price, stock, specification, discountprice
//         } = req.body;

//         console.log(name,description,category, price, stock, specification, discountprice,'============');
        

//         const updatedProduct = await Product.findByIdAndUpdate(
//             productId,
//             { $set: { name, description, category, price, stock, specification, discountprice,image:images } },
//             { new: true }
//         );

//         res.json({ message: 'Product updated successfully', updatedProduct });
//     } catch (error) {
//         console.error('Error updating product:', error);
//         res.status(500).json({ message: 'Error updating product', error });
//     }
// };


const editProduct = async (req, res) => {
    try {
        console.log('Edit Product');
        const productId = req.params.id;

        const existingProduct = await Product.findById(productId);
        if (!existingProduct) return res.status(404).json({ message: 'Product not found' });

        const newImages = req.files.map(file => file.filename);
        
        const { keepImages } = req.body;
        let updatedImages = keepImages ? JSON.parse(keepImages) : existingProduct.image;

        updatedImages = [...updatedImages, ...newImages];

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
        
        console.log('Received request to delete image:', imageName);
        console.log('Product ID:', id);

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

//=====================================================


// const editProduct = async (req, res) => {
//     try {
//         const productId = req.params.id;
//         const { name, description, category, price, stock, specification, discountprice } = req.body;
//         console.log("name,stock",name,description, category, price, stock, specification, discountprice);
        

//         // Fetch the product by ID
//         // if (!product) {
//         //     return res.status(404).json({ message: 'Product not found' });
//         // }
        
//         // Update product fields
//         // product.name = name;
//         // product.description = description;
//         // product.category = category;
//         // product.price = price;
//         // product.stock = stock;
//         // product.specification = specification;
//         // product.discountprice = discountprice;
//         // console.log("================================");
//         // console.log(req.body);
//         // console.log(req.params);
//         // console.log(req.url);
//         // console.log("================================");
        
//         const products=await Product.find().populate('category')  
//         const product = await Product.findByIdAndUpdate (productId,{
//             $set:{
//                 ...req.body
//             }
//         },{new:true});
//         // Save the updated product to the database
        

//         // Respond with success
//         return   res.render('admin/products',{product:products})
//     } catch (error) {
//         console.error('Error editProduct:', error);
//         return res.status(500).json({ message: 'Error updating product', error });
//     }
// };


// const editProduct = async (req, res) => {
//     try {
//         const productId = req.params.id;
//         console.log('=====================================');
        

//         const {name,description,category,price,stock,specification,discountprice,removedImages} = req.body;

//         // const newImages = req.files.newImages; 
//         // const updatedImages = []; 

//         // if (newImages && Array.isArray(newImages)) {
//         //     for (const image of newImages) {

//         //         const imagePath = await saveImage(image);
//         //         updatedImages.push(imagePath);
//         //     }
//         // }

//         const product = await Product.findById(productId);
//         if (!product) {
//             return res.status(404).json({ message: 'Product not found' });
//         }

//         // Update product fields
//         product.name = name;
//         product.description = description;
//         product.category = category;
//         product.price = price;
//         product.stock = stock;
//         product.specification = specification;
//         product.discountprice = discountprice;

//         // if (removedImages) {
//         //     // Remove images from the product's image array based on the removedImages array
//         //     product.image = product.image.filter(img => !removedImages.includes(img.id));
//         // }
//         // // Add new images to the product
//         // product.image.push(...updatedImages);

//         // Save the updated product to the database
//         await product.save();

//         // Redirect or respond with success
//         return res.status(200).json({ message: 'Product updated successfully' });
//     } catch (error) {
//         console.error('Error updating product:', error);
//         return res.status(500).json({ message: 'Error updating product', error });
//     }
// };

// Implement this function to handle the image saving logic
async function saveImage(image) {
    // Use your preferred method to save images (e.g., to a file system, cloud storage)
    // Return the path or URL of the saved image
}





const changeProductStatus = async (req, res) => {
    const { productId, action } = req.body;
    console.log(productId,action)
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
    console.log('Product ID to delete', productId);

    try {
        const deleteProduct=await Product.findByIdAndDelete(productId)

        if(!deleteProduct){
            return res.status(404).send('Product not found')
        }

        console.log('Deleted product:',deleteProduct);
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