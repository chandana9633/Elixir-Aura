const User=require('../../models/user/userModel')


const addAddressPage=async (req,res) => {
    try {
        res.render('user/userAddressPage')
    } catch (error) {
        
    }
}


const addAddress = async (req, res) => {
    try {
        const { phone, streetAddress, city, state, pincode, country, addressType } = req.body;

        const userId = req.session.user?.id; 
        if (!userId) {
            return res.status(401).send('Unauthorized. User not logged in.');
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).send('User not found.');
        }

        if (user.address.length >= 3) {
            return res.status(400).send('You can only save up to 3 addresses.');
        }

        // Add new address
        user.address.push({
            street: streetAddress,
            city: city,
            state: state,
            pincode: pincode,
            country: country,
            phone: phone,
            addressType: addressType,
        });
        await user.save();

        console.log('Address added:', user.address);
        
        res.redirect('/profile');
    } catch (error) {
        console.error('Error adding address:', error);
        res.status(500).send('Internal Server Error.');
    }
};




const editAddressPage = async (req, res) => {
    try {
        const addressId = req.params.addressId; 
        const userId = req.session.user?.id; 
        console.log(userId,addressId);
        
        const user = await User.findOne({_id: userId,"address._id": addressId});
        console.log("user",user);
        
        if (!user) {
            return res.status(404).send('User or Address not found.');
        }

        const address = user.address.id(addressId);
        
        res.render('user/editAddress', { address, user }); 
    } catch (error) {
        console.error('Error loading edit address page:', error);
        res.status(500).send('Internal Server Error.');
    }
};

const updateAddress = async (req, res) => {
    try {
        const addressId = req.params.addressId;
        const userId = req.session.user?.id;

        const { phone, street, city, state, pincode, country, addressType } = req.body;

        const user = await User.findOneAndUpdate(
            { _id: userId, "address._id": addressId },
            {
                $set: {
                    "address.$.phone": phone,
                    "address.$.street": street,
                    "address.$.city": city,
                    "address.$.state": state,
                    "address.$.pincode": pincode,
                    "address.$.country": country,
                    "address.$.addressType": addressType,
                },
            },
            { new: true } 
        );

        if (!user) {
            return res.status(404).send('User or Address not found.');
        }

        res.redirect('/profile');
    } catch (error) {
        console.error('Error updating address:', error);
        res.status(500).send('Internal Server Error.');
    }
};


const deleteAddress = async (req, res) => {
    try {
        const userId = req.session.user?.id; 
        const addressId = req.params.addressId; 

        const user = await User.findOne({ _id: userId, "address._id": addressId });

        if (!user) {
            return res.status(404).send('User or address not found.');
        }

        user.address = user.address.filter(add => add._id.toString() !== addressId.toString());

        await user.save();

        res.redirect('/profile');
    } catch (error) {
        console.error('Error deleting address:', error);
        res.status(500).send('Server error');
    }
};



module.exports={
    addAddressPage,
    addAddress,
    editAddressPage,
    updateAddress,
    deleteAddress

}

