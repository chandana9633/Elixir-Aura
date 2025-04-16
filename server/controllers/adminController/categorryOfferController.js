const Category=require('../../models/admin/categoryModel')
const categoryOffer =require('../../models/admin/categoryOfferModel')
const Product=require('../../models/admin/productModel')


const CategoryOfferListPage = async (req, res) => {
    try {
        const categoryOffers = await categoryOffer
            .find()
            .populate('categoryId', 'name'); 

        if (!categoryOffers || categoryOffers.length === 0) {
            return res.render('admin/categoryOfferListPage', { categoryOffers: [] });
        }

        res.render('admin/categoryOfferListPage', { categoryOffers });
    } catch (error) {
        console.error('Error fetching category offers:', error);
        res.status(500).send('Server Error');
    }
};

const addCategoryOfferPage = async (req, res) => {
    try {
        const categoryoffer = await categoryOffer.find()
        const categories = await Category.find();

        if (!categoryoffer) {
            return res.status(404).json({ success: false, message: 'prodcutOffer not found !' })
        }
        res.render('admin/addOfferCategory', { categoryoffer, categories })

    } catch (error) {
        console.error('the error will show on the addOfferpage :', error)
        return res.status(500).json({ error: 'serve error' })
    }
}


const addCategoryOffer = async (req, res) => {
    try {
        const { categoryId, discountPercentage, endDate } = req.body;
        if (!categoryId || !discountPercentage || !endDate) {
            return res.status(400).json({ success: false, message: 'Please fill all required fields!' });
        }
        const EndDate=new Date(endDate)
        if (EndDate<=new Date()) {
            return res.status(400).json({success:false,message: 'End date must be in the future.' })
        }

        if (discountPercentage < 0 || discountPercentage > 90) {
            return res.status(400).json({ success: false, message: 'Discount percentage must be between 0 and 90.' });
        }

        const existCategoryOffer=await categoryOffer.findOne({categoryId,endDate:{$gte:new Date()}})
        if (existCategoryOffer) {
            return res.status(400).json({ success: false, message: 'already the category offer in this category.' });
        }

        const newCategoryOffer = new categoryOffer({
            categoryId,
            discountPercentage,
            endDate
        });

        console.log('newProductOffer', newCategoryOffer);

        await newCategoryOffer.save();

        await Product.updateMany({
            category: categoryId,
            $or: [{
                discountprice: {
                    $exists: false
                }
            },
            {
                discountprice: undefined
            },
            {
                discountprice: ""
            },
            {
                discountprice: 0
            }
            ]
        },
            [
                {
                    $set:
                    {
                        categoryOffer:discountPercentage,
                        categoryOfferEndDate: endDate

                    }
                }
            ]
        )

        await categoryOffer.deleteMany({endDate:{$lt:new Date()}})

        res.json({ success: true, message: 'Product offer added successfully.' });

    } catch (error) {
        console.error('The error will show on addProductOffer:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};



const editCategoryOfferPage = async (req, res) => {
    try {
        const offerId = req.params.offerId;
        const categoryoffer = await categoryOffer.findById(offerId).populate('categoryId', 'name');
        if (!categoryoffer) {
            return res.status(404).json({ success: false, message: 'Category offer not found' });
        }
        const categories = await Category.find();
        res.render('admin/editCategoryOffer', { categoryoffer, categories });
    } catch (error) {
        console.error('The error occurred on the edit category offer page:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};



const updateCategoryOffer = async (req, res) => {
    try {
        const offerId = req.params.offerId;
        const { categoryId, discountPercentage, endDate } = req.body;

        if (!categoryId || !discountPercentage || !endDate) {
            return res.status(400).json({ success: false, message: 'Please fill all required fields!' });
        }

        const EndDate = new Date(endDate);
        if (EndDate <= new Date()) {
            return res.status(400).json({ success: false, message: 'End date must be in the future.' });
        }

        if (discountPercentage < 0 || discountPercentage > 90) {
            return res.status(400).json({ success: false, message: 'Discount percentage must be between 0 and 90.' });
        }

        const updatedCategoryOffer = await categoryOffer.findByIdAndUpdate(
            offerId,
            { categoryId, discountPercentage, endDate },
            { new: true }
        );

        if (!updatedCategoryOffer) {
            return res.status(404).json({ success: false, message: 'Category offer not found' });
        }

        await Product.updateMany({
            category: categoryId,
            $or: [{
                discountprice: {
                    $exists: false
                }
            },
            {
                discountprice: undefined
            },
            {
                discountprice: ""
            },
            {
                discountprice: 0
            }
            ]
        },
            [
                {
                    $set:
                    {
                        categoryOffer:discountPercentage,
                        categoryOfferEndDate: endDate

                    }
                }
            ]
        )
        await categoryOffer.deleteMany({ endDate: { $lt: new Date() } });

        res.json({ success: true, message: 'Category offer updated successfully.' });
    } catch (error) {
        console.error('The error occurred while updating the category offer:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};


const removeCategoryOffer = async (req, res) => {
    try {
        const offerId = req.params.offerId;

        const deletedCategoryOffer = await categoryOffer.findByIdAndDelete(offerId);

        if (!deletedCategoryOffer) {
            return res.status(404).json({ success: false, message: 'Category offer not found' });
        }

        await Product.updateMany(
            { category: deletedCategoryOffer.categoryId },
            {
                $unset: {
                    categoryOfferamount: "",
                    categoryOfferEndDate: ""
                }
            }
        );

        return res.status(200).json({ success: true, message: 'Category offer deleted successfully' });
    } catch (error) {
        console.error('Error occurred while deleting category offer:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports={
    CategoryOfferListPage,
    addCategoryOfferPage,
    addCategoryOffer,
    editCategoryOfferPage,
    updateCategoryOffer,
    removeCategoryOffer
}