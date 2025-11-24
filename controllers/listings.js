const countryList = require("../utils/countries.js");
const Listing = require("../models/listing.js");
const User = require("../models/user.js");
const multer = require("multer");
const ExpressError = require("../utils/ExpressError.js");
const axios = require("axios");
const Fuse = require("fuse.js");
const { cloudinary } = require("../cloudConfig.js");

// =========================MAIN INDEX PAGE==============================

module.exports.index = async (req, res) => {
  const { category, sort, country } = req.query;

  // 1. Build filters
  let filter = {};

  // CATEGORY FILTER (supports single or multiple)
  let selectedCategories = [];

  if (!category) {
    selectedCategories = [];
  } else if (typeof category === "string") {
    selectedCategories = [category];
  } else {
    selectedCategories = category;
  }

  if (selectedCategories.length > 0) {
    filter.category = { $in: selectedCategories };
  }

  // COUNTRY FILTER
  let selectedCountries = [];
  if (!country) selectedCountries = [];
  else if (typeof country === "string") selectedCountries = [country];
  else selectedCountries = country;

  if (selectedCountries.length > 0) {
    const regexCountries = selectedCountries.map((c) => new RegExp(c, "i"));
    filter.country = { $in: regexCountries };
  }

  // 2. Sorting
  let priceSort = null;
  if (sort === "price_asc") priceSort = { price: 1 };
  else if (sort === "price_desc") priceSort = { price: -1 };

  // Detect filter usage
  const filtersApplied =
    selectedCategories.length > 0 || sort || selectedCountries.length > 0;

  // 3. User NOT logged in → random
  if (!req.user) {
    let allListings = await Listing.find(filter).sort(priceSort);
    // allListings = allListings.sort(() => Math.random() - 0.5);

    if (allListings.length === 0) {
      req.flash("error", "No listing found for your filter");
      return res.redirect("/listings");
    }

    return res.render("./listings/index.ejs", {
      allListings,
      currentCategory: selectedCategories,

      allCountries: countryList,
      selectedCountries,
      selectedSort: sort || "",
    });
  }

  // 4. Logged in user

  const user = await User.findById(req.user._id);
  const preferences = user.preferences || [];

  //  If filters applied → ignore preferences
  if (filtersApplied) {
    let allListings = await Listing.find(filter).sort(priceSort);

    if (allListings.length === 0) {
      req.flash("error", "No listing found for your filter");
      return res.redirect("/listings");
    }

    return res.render("./listings/index.ejs", {
      allListings,
      currentCategory: selectedCategories,

      allCountries: countryList,
      selectedCountries,
      selectedSort: sort || "",
    });
  }

  //  No filters AND user has preferences → preference sorting
  if (preferences.length > 0) {
    const pipeline = [
      { $match: filter },
      {
        $addFields: {
          matchScore: {
            $size: { $setIntersection: ["$category", preferences] },
          },
        },
      },
      { $sort: { matchScore: -1 } },
    ];

    let allListings = await Listing.aggregate(pipeline);
    allListings.forEach((l) => delete l.matchScore);

    return res.render("./listings/index.ejs", {
      allListings,
      currentCategory: selectedCategories,

      allCountries: countryList,
      selectedCountries,
      selectedSort: sort || "",
    });
  }

  //  No preferences → normal listing
  let allListings = await Listing.find(filter).sort(priceSort);

  res.render("./listings/index.ejs", {
    allListings,
    currentCategory: selectedCategories,

    allCountries: countryList,
    selectedCountries,
    selectedSort: sort || "",
  });
};

//====================================SEARCH BAR===============================
module.exports.search = async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.redirect("/listings");
    }

    const allListings = await Listing.find({});

    const options = {
      keys: ["title", "location", "country"],
      includeScore: true,
      threshold: 0.2,
    };

    const fuse = new Fuse(allListings, options);
    const results = fuse.search(query);
    const searchResults = results.map((result) => result.item);

    if (searchResults.length === 0) {
      req.flash("error", "No listings found matching that search.");
      return res.redirect("/listings");
    }

    res.render("listings/index.ejs", {
      allListings: searchResults,
      query: query,
      currentCategory: [], // 🔥 REQUIRED
      selectedCountries: [], // optional but safe
      selectedSort: "", // optional but safe
    });
  } catch (err) {
    console.error(err);
  }
};

//=============================SHOW LISTING=================================
module.exports.showListing = async (req, res) => {
  let { id } = req.params;

  const listing = await Listing.findById(id)
    .populate({
      path: "reviews",
      populate: {
        path: "author",
      },
    })
    .populate("owner");

  if (!listing) {
    req.flash("error", "Listing you requested for does not exist");
    return res.redirect("/listings");
  }

  res.render("listings/show.ejs", { listing });
};

// ===========================NEW LISTING=====================================

module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};

module.exports.createListing = async (req, res) => {
  let url = req.file.path;
  let filename = req.file.filename;
  const locationString = req.body.location;

  // The URL for the OpenCage API
  const geocodeUrl = `https://api.opencagedata.com/geocode/v1/json`;

  // The parameters for the request, including your key
  const params = {
    q: locationString,
    key: process.env.OPENCAGE_MAP_TOKEN,
    limit: 1,
  };

  // Make the API call
  const response = await axios.get(geocodeUrl, { params });
  const geometry = response.data.results[0].geometry;
  const newListingData = req.body;

  await Listing.create({
    ...newListingData,
    image: {
      filename: filename,
      url: url,
    },
    geometry: {
      type: "Point",
      coordinates: [geometry.lng, geometry.lat],
    },
    owner: req.user._id,
  });
  req.flash("success", "New Listing Created (:");
  res.redirect("/listings");
};

// ===============================EDIT LISTING===================================
module.exports.renderEditForm = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing you requested for does not exist");
    return res.redirect("/listings");
  }
  res.render("listings/edit.ejs", { listing });
};

module.exports.editListing = async (req, res) => {
  let { id } = req.params;

  const newListingData = req.body;
  const locationString = req.body.location;
  const geocodeUrl = `https://api.opencagedata.com/geocode/v1/json`;
  const params = {
    q: locationString,
    key: process.env.OPENCAGE_MAP_TOKEN,
    limit: 1,
  };
  const response = await axios.get(geocodeUrl, { params });
  const geometry = response.data.results[0].geometry;
  let result = await Listing.findByIdAndUpdate(
    id,
    {
      ...newListingData,
      geometry: {
        type: "Point",
        coordinates: [geometry.lng, geometry.lat],
      },
    },
    { runValidators: true }
  );
  if (req.file) {
    let url = req.file.path;
    let filename = req.file.filename;
    await Listing.findByIdAndUpdate(
      id,
      {
        ...newListingData,
        image: {
          filename: filename,
          url: url,
        },
        geometry: {
          type: "Point",
          coordinates: [geometry.lng, geometry.lat],
        },
      },
      { runValidators: true }
    );
  }

  req.flash("success", "Listing Updated");
  res.redirect(`/listings/${id}`);
};

// =======================DELETE LISTING============================
module.exports.deleteListing = async (req, res) => {
  let { id } = req.params;

  let deletedListing = await Listing.findByIdAndDelete(id);

  if (deletedListing.image && deletedListing.image.filename) {
    await cloudinary.uploader.destroy(deletedListing.image.filename);
  }
  req.flash("success", "Listing Deleted!");
  res.redirect("/listings");
};

module.exports.multerSizehandler = (error, req, res, next) => {
  if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
    req.flash("error", "File is too large. Maximum size is 5MB.");
    return res.redirect("/listings/new");
  }
  // Handle other errors if needed
  throw new ExpressError(400, error.message);
};

// ==========================Booking listing =================================

module.exports.renderBookingDetailsPage = async (req, res) => {
  let { id } = req.params;
  // let BookingListing = await Listing.findById(id);

  res.render("listings/book.ejs", { id });
};

module.exports.renderCheckoutPage = async (req, res) => {
  let { id } = req.params;
  let listing = await Listing.findById(id);
  let { checkIn, checkOut, guests } = req.query;
  let cIn = new Date(checkIn);
  let cOut = new Date(checkOut);

  if (cIn > cOut) {
    req.flash("error", "check-in date cannot be after check-out date ");
    return res.redirect(`/listings/${id}/book`);
  }

  const diffDays = (cOut - cIn) / (1000 * 60 * 60 * 24);

  if (diffDays > 30) {
    req.flash("error", "you can't book for more than 30 days");
    return res.redirect(`/listings/${id}/book`);
  }

  res.render("listings/checkout", {
    checkIn,
    checkOut,
    guests,
    diffDays,
    listing,
  });
};
