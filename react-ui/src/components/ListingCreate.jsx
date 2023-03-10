import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import LoadingButton from "@mui/lab/LoadingButton";
import Grid from "@mui/material/Grid";
import InputAdornment from "@mui/material/InputAdornment";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import OutlinedInput from "@mui/material/OutlinedInput";
import { createListing } from "../database/listing";
import { getHost } from "../database/settings";
import { sendListingToContacts, getMiniAddress } from '../minima';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';



export default function ListingCreate() {
  const [loading, setLoading] = useState(false);
  const [host, setHost] = useState();
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [form, setForm] = useState({
    name: "",
    image: null,
    asking_price: "",
  });
  const [walletAddress, setWalletAddress] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    getHost().then((host) => {
      setHost(host);
    });
  },[]);

  useEffect(() => {
    async function getWalletAddress() {
      setWalletAddress(await getMiniAddress().catch((e)=>console.error(`Get Mini address failed: ${e}`)));
    }
    getWalletAddress().catch((e)=>console.error(`Get wallet address failed: ${e}`));
  }, []);

  // These methods will update the state properties.
  function updateForm(value) {
    return setForm((prev) => {
      return { ...prev, ...value };
    });
  }

  // This will verify image
  // accept="image/*" will not work in TextField and default upload of MUI is not so good
  function imageChange(e) {
    e.preventDefault();
    const {files} = e.target
    if (files.length) {
      const acceptedImageTypes = ['image/gif', 'image/jpeg', 'image/png'];
      if (acceptedImageTypes.includes(files[0].type)) {
        updateForm({image: e.target.files[0]})
        return;
      } else {
        e.target.value = null;
      }
    }
    updateForm({image: null})
  //  You may through error here...
  }

  // This function will handle the submission.
  async function onSubmit(e) {
    e.preventDefault();

    if(form.image){
      form.image = await new Promise(resolve => {
        const myReader = new FileReader();
        myReader.onloadend = (e) => {
          resolve(myReader.result);
        }
        myReader.readAsDataURL(form.image);
      })
    }

    setLoading(true);
    setError(null);

    // When a post request is sent to the create url, we'll add a new record to the database.
    const newListing = { ...form };
    const { name, image, asking_price: price } = newListing
    const { pk: createdByPk, name: createdByName } = host

    createListing({
      name, image, price,
      createdByPk,
      createdByName,
      walletAddress,
    })
    .then(function(listingId) {
        console.log(`Listing successfully added: ${listingId}`);
        console.log(`Attempting to send listing to contacts...`);
        return sendListingToContacts(listingId);
      }).then((result) => {
        if (result.message){
          setError(`Could not send listing to contacts`);
          setForm({ name: "", image: null, asking_price: "" });
          console.error(result.message);
          setLoading(false);
        } else {
          console.log('Successfully sent listing to contacts');
          setLoading(false);
          setForm({ name: "", image: null, asking_price: "" });
          setSuccess(true);
        }
      }).catch((e) => {
        setError(`There was an error creating or sending your listing`);
        setForm({ name: "", image: null, asking_price: "" });
        console.error(`Could not create or send listing ${e}`);
        setLoading(false);
      });
  }

  const handleGoHome = () => {
    navigate(-1);
  }

  if (walletAddress && host) {
    // This following section will display the form that takes the input from the user.
    return (
      <Box
        sx={{
          marginTop: 4,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Typography variant="h4" gutterBottom>
          Create New Listing
        </Typography>
        <Box
          component="form"
          sx={{ mt: 3 }}
          noValidate
          autoComplete="off"
          onSubmit={onSubmit}
        >
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Listing Title"
                InputLabelProps={{ shrink: true }}
                id="listing-name"
                className="form-field"
                type="text"
                required
                fullWidth
                name="title"
                value={form.name}
                onChange={(e) => updateForm({ name: e.target.value })}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Image"
                InputLabelProps={{ shrink: true }}
                id="image"
                className="form-field"
                type="file"
                required
                fullWidth
                name="image"
                onChange={imageChange}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel
                  htmlFor="asking-price"
                  InputLabelProps={{ shrink: true }}
                >Asking Price *</InputLabel>
                <OutlinedInput
                  id="asking-price"
                  value={form.asking_price}
                  required="true"
                  onChange={(e) => updateForm({ asking_price: e.target.value })}
                  startAdornment={
                    <InputAdornment position="start">MIN</InputAdornment>
                  }
                  label="Asking Price"
                />
              </FormControl>
            </Grid>
          </Grid>
          <LoadingButton
            fullWidth
            variant="contained"
            type="submit"
            value="Create Token"
            loading={loading}
            loadingPosition="end"
            sx={{ mt: 3, mb: 2 }}
          >
            Publish
          </LoadingButton>
          {error ? <Alert severity="error">{error}</Alert> : null}
          {success ? <Alert action={
            <Button color="inherit" size="small" onClick={handleGoHome}>
              OK
            </Button>
          } severity="success">Listing created and shared!</Alert> : null}
        </Box>
      </Box>
    );
  }
  else {
    return (
      <Stack mt={4} spacing={1}>
        {/* For variant="text", adjust the height via font-size */}
        <Skeleton variant="text" sx={{ fontSize: '2rem' }} />
        {/* For other variants, adjust the size with `width` and `height` */}
        <Skeleton variant="rounded" width='100%' height={60} />
        <Skeleton variant="rounded" width='100%' height={60} />
        <Skeleton variant="rounded" width='100%' height={60} />
      </Stack>
    );
  }
}
