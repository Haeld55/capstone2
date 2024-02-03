import { useEffect, useState } from 'react';
import axios from 'axios';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function SettingData() {
  const [selectedServiceType, setSelectedServiceType] = useState('');
  const [newCost, setNewCost] = useState('');

  const handleUpdateService = async (e) => {
    e.preventDefault();

    try {
      // Make a PUT request to the washUpdate API endpoint
      const response = await axios.put('/api/service/update', {
        serviceType: selectedServiceType,
        newCost: newCost,
      });

      // Display a success toast
      toast.success('Service updated successfully!', {
        position: 'top-center',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
      });

      setSelectedServiceType('');
      setNewCost('');
    } catch (error) {
      console.error('Error updating Wash&Dry service:', error);
      // Handle error and provide user feedback if necessary
    }
  };

  const [walk, setWalk] = useState(null);
  const [drop, setDrop] = useState(null);
  const [wash, setWash] = useState(null);
  const [special, setSpecial] = useState(null);

  const fetchData = async (serviceType, setData, endpoint) => {
    try {
      const response = await fetch(endpoint);
      const data = await response.json();
      setData(data);
    } catch (error) {
      console.error(`Error fetching ${serviceType} service:`, error);
    }
  };

  useEffect(() => {
    const fetchWalkInService = () => {
      fetchData('WalkIn', setWalk, '/api/service/walk');
    };
    fetchWalkInService();

    const intervalId = setInterval(fetchWalkInService, 1000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const fetchDropInService = () => {
      fetchData('DropOff', setDrop, '/api/service/drop');
    };
    fetchDropInService();

    const intervalId = setInterval(fetchDropInService, 1000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const fetchWashInService = () => {
      fetchData('WashAndDry', setWash, '/api/service/wash');
    };
    fetchWashInService();

    const intervalId = setInterval(fetchWashInService, 1000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const fetchSpecialInService = () => {
      fetchData('SpecialItem', setSpecial, '/api/service/special');
    };
    fetchSpecialInService();

    const intervalId = setInterval(fetchSpecialInService, 1000);

    return () => clearInterval(intervalId);
  }, []);

  const [starDetails, setStarDetails] = useState([]);

  useEffect(() => {
    const fetchStarDetails = async () => {
      try {
        const response = await axios.get('/api/star/view'); // Replace with your actual API endpoint
        setStarDetails(response.data);
      } catch (error) {
        console.error('Error fetching star details:', error);
      }
    };

    fetchStarDetails();
  }, []);
  
  const [gcashEntries, setGcashEntries] = useState([]);
  const [selectedEntryId, setSelectedEntryId] = useState(null);
  const [qrImageFile, setQrImageFile] = useState(null);
  const [showUploadButton, setShowUploadButton] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/gcash/gcashV'); // Update the URL based on your server configuration
        const data = await response.json();
        setGcashEntries(data);
      } catch (error) {
        console.error('Error fetching Gcash entries:', error);
      }
    };

    fetchData();
  }, []);

  const handleFileChangeUpload = (event, entryId) => {
    const file = event.target.files[0];

    if (file && file.type.startsWith('image/')) {
      // It's an image file, proceed with your logic
      setQrImageFile(file);
      // Additional logic or state updates as needed
    } else {
      // It's not an image file, show an error toast
      toast.error('Please select a valid image file.', {
        position: 'top-center',
        autoClose: 3000, // 3 seconds
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
      }).then(() => {
        // This code will execute after the toast is closed
        // You can perform any additional actions here
        window.location.reload(); // Refresh the page
      });
    }
  };
  

  const handleFileUploadUpload = () => {
    const storage = getStorage();
    const fileName = new Date().getTime() + qrImageFile.name;
    const storageRef = ref(storage, fileName);
    const uploadTask = uploadBytesResumable(storageRef, qrImageFile);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setFilePerc(Math.round(progress));
      },
      (error) => {
        setFileUploadError(true);
        console.error(error);
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((url) => {
          setDownloadURL(url);
          setUploadComplete(true);
        });
      }
    );
    handleUploadComplete();
  };

  const handleUploadComplete = () => {
    // Your logic when the upload is complete
    setShowUploadButton(false);
  };

  const handleUpdate = async () => {
    if (!selectedEntryId || !uploadComplete) {
      console.error('Please select an entry and complete the file upload.');
      return;
    }
  
    try {
      // Send the download URL to the server to update the Gcash entry
      const response = await fetch(`/api/gcash/gcashU/${selectedEntryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ QRImage: downloadURL }),
      });
  
      if (response.ok) {
        // Refresh the Gcash entries after successful update
        const updatedData = await response.json();
        setGcashEntries((prevEntries) =>
          prevEntries.map((entry) =>
            entry._id === updatedData._id ? updatedData : entry
          )
        );
  
        // Display a success toast
        toast.success('Gcash entry updated successfully!', {
          position: 'top-center',
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: true,
        });
  
        // Clear the selected entry and file after update
        setSelectedEntryId(null);
        setQrImageFile(null);
        setUploadComplete(false);
  
        // Refresh the page after 3 seconds
        setTimeout(() => {
          window.location.reload(); // You can use other methods to refresh your page if needed
        }, 3000);
      } else {
        console.error('Error updating Gcash entry:', response.statusText);
      }
    } catch (error) {
      console.error('Error updating Gcash entry:', error);
    }
  };


  const [file, setFile] = useState(null);
  const [filePerc, setFilePerc] = useState(0);
  const [fileUploadError, setFileUploadError] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [downloadURL, setDownloadURL] = useState(null); // Add this state

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleFileUpload = () => {
    const storage = getStorage();
    const fileName = new Date().getTime() + file.name;
    const storageRef = ref(storage, fileName);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setFilePerc(Math.round(progress));
      },
      (error) => {
        setFileUploadError(true);
        console.error(error);
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((url) => {
          setDownloadURL(url); // Set the downloadURL state
          setUploadComplete(true);
        });
      }
    );
  };

  const handleSaveToDatabase = () => {
    // Only allow saving to the database if the upload is complete
    if (uploadComplete) {
      axios.post('/api/gcash/gcash', { QRImage: [downloadURL] })
        .then((response) => {
          console.log('Gcash entry created successfully:', response.data);
          // Handle success as needed
        })
        .catch((error) => {
          console.error('Error creating Gcash entry:', error);
          // Handle error as needed
        });
    } else {
      console.log('Wait for the file upload to complete before saving to the database.');
      // You might want to inform the user or handle this case differently
    }
  };

  useEffect(() => {
    if (file) {
      handleFileUpload();
    }
  }, [file]);
  
  return (
    <div>
      <div className="">
        <div className="p-[25px] mt-5 mb-5">
          <h1 className="font-bold uppercase text-3xl text-gray-600">Setting</h1>
        </div>
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="flex flex-col lg:flex-row items-center">
            <div>
              <form onSubmit={handleUpdateService} className="space-y-4">
                <div>
                  <label htmlFor="serviceType" className="block text-4xl font-bold text-gray-500">
                    Service Type
                  </label>

                  <select
                    name="serviceType"
                    id="serviceType"
                    value={selectedServiceType}
                    onChange={(e) => setSelectedServiceType(e.target.value)}
                    className="p-3 w-full rounded-xl border border-black text-gray-700 sm:text-sm"
                  >
                    <option value="">Please select</option>
                    <option value="WalkIn">Walk In</option>
                    <option value="DropOff">Drop Off</option>
                    <option value="WashAndDry">Wash And Dry</option>
                    <option value="SpecialItem">Special Item</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="newCost" className="block text-4xl font-bold text-gray-500">
                    New Cost
                  </label>
                  <input
                    type="text"
                    id="newCost"
                    value={newCost}
                    onChange={(e) => setNewCost(e.target.value)}
                    className="p-3 w-full rounded-xl border border-black text-gray-700 sm:text-sm"
                    placeholder="New Cost"
                  />
                </div>
                <div>
                  <button type="submit" className="btn btn-outline btn-info">
                    Update Service
                  </button>
                </div>
              </form>
            </div>
            <div className="">
            <section className="bg-white">
              <div className="mx-auto max-w-screen-xl px-4 py-10 sm:px-6 md:py-0 lg:px-4 xl:px-8">

                <div className="mt-8 sm:mt-12 flex flex-col gap-3">
                  <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex flex-col rounded-lg bg-blue-100 px-5 py-5 text-center justify-center">
                      <dt className="order-last text-xl font-bold text-gray-500 my-5">WALK IN</dt>

                      {walk ? (
                        <dd className="text-4xl font-extrabold text-blue-600 md:text-5xl">
                            ₱ {walk.defaultCost}
                        </dd>
                      ) : (
                        <dd className="text-4xl font-extrabold text-blue-600 md:text-5xl">Loading...</dd>
                      )}

                    </div>

                    <div className="flex flex-col rounded-lg bg-blue-100 px-5 py-5 text-center">
                        <dt className="order-last text-lg font-medium text-gray-500 my-5">DROP OFF</dt>

                        {drop ? (
                        <dd className="text-4xl font-extrabold text-blue-600 md:text-5xl">
                            ₱ {drop.defaultCost}
                        </dd>
                      ) : (
                        <dd className="text-4xl font-extrabold text-blue-600 md:text-5xl">Loading...</dd>
                      )}
                    </div>
                  </dl>
                  <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex flex-col rounded-lg bg-blue-100 px-5 py-5 text-center justify-center">
                        <dt className="order-last text-lg font-medium text-gray-500 my-5">SPECIAL ITEM</dt>

                        {special ? (
                        <dd className="text-4xl font-extrabold text-blue-600 md:text-5xl">
                            ₱ {special.defaultCost}
                        </dd>
                      ) : (
                        <dd className="text-4xl font-extrabold text-blue-600 md:text-5xl">Loading...</dd>
                      )}
                    </div>

                    <div className="flex flex-col rounded-lg bg-blue-100 px-5 py-5 text-center">
                      <dt className="order-last text-lg font-medium text-gray-500 my-5">WASH AND DRY</dt>

                      {wash ? (
                        <dd className="text-4xl font-extrabold text-blue-600 md:text-5xl">
                            ₱ {wash.defaultCost}
                        </dd>
                      ) : (
                        <dd className="text-4xl font-extrabold text-blue-600 md:text-5xl">Loading...</dd>
                      )}
                    </div>
                  </dl>
                </div>
              </div>
            </section>
            </div>
            <div className="">
              {gcashEntries.length === 0 && (
                <form>
                  <input type="file" onChange={handleFileChange} accept='image/*' />
                  {filePerc > 0 && <p>Upload Progress: {filePerc}%</p>}
                  {fileUploadError && <p style={{ color: 'red' }}>Error uploading file</p>}
                  <button type="button" className='btn' onClick={handleSaveToDatabase} disabled={!uploadComplete}>
                    Save to Database
                  </button>
                </form>
              )}
            </div>

            <div className="">
              <div>
                <h1 className='font-bold uppercase text-2xl text-gray-600'>Gcash Details</h1>
                {gcashEntries.length > 0 ? (
                  <ul>
                    {gcashEntries.map((entry) => (
                      <li key={entry._id}>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChangeUpload(e, entry._id)}
                          hidden
                          ref={(fileRef) => (entry.fileRef = fileRef)}
                        />
                        <img
                          onClick={() => {
                            entry.fileRef.click();
                            setSelectedEntryId(entry._id);
                          }}
                          src={entry.QRImage}
                          alt="Gcash Details"
                          className="h-52 w-52 rounded-lg object-cover cursor-pointer"
                        />

                        {filePerc > 0 && <p className='font-bold text-green-500'>Upload Progress: {filePerc}%</p>}
                        {fileUploadError && <p style={{ color: 'red' }}>Error uploading file</p>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No Gcash entries available.</p>
                )}
                {selectedEntryId && (
                  <div>
                    {showUploadButton && (
                      <button onClick={handleFileUploadUpload} className='btn'>
                        Upload File
                      </button>
                    )}
                    {uploadComplete && (
                      <button onClick={handleUpdate} className='btn'>
                        Done
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>      
          </div>
          {/* <div className="">
            <section className="">
            <div className="mx-auto max-w-screen-2xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
              <div className="md:flex md:items-end md:justify-between">
                <div className="max-w-xl">
                  <h2 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
                    Read trusted reviews from our customers
                  </h2>
                </div>

                <button className="btn btn-outline btn-info" onClick={()=>document.getElementById('my_modal_3').showModal()}
                >
                  <span className="font-medium"> Read all reviews </span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 rtl:rotate-180"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
                <dialog id="my_modal_3" className="modal">
                  <div className="modal-box">
                    <div className="flex items-center justify-center">
                      <h1 className='font-bold uppercase text-4xl text-gray-500'>Feedback</h1>
                    </div>
                    <form method="dialog">
                    <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-1">
                        {Array.isArray(starDetails) &&
                          starDetails.map((review, index) => (
                            <blockquote key={index} className="flex h-full flex-col justify-between bg-white p-6 shadow-sm sm:p-8">
                              <div>
                                <div className="rating">
                                  {[...Array(review.rates).keys()].map((starIndex) => (
                                    <input
                                      key={starIndex}
                                      type="radio"
                                      name={`rating-${index}`}
                                      className="mask mask-star-2 bg-orange-400"
                                      checked
                                      readOnly
                                    />
                                  ))}
                                </div>

                                <div className="mt-4">
                                  <p className="text-2xl font-bold text-rose-600 sm:text-3xl">
                                    {review.user ? review.user.username.replace(/.(?=.{4})/g, '*') : 'Anonymous'}
                                  </p>

                                  <p className="mt-4 leading-relaxed text-gray-700">{review.notes}</p>
                                </div>
                              </div>

                              <footer className="mt-4 text-sm font-medium text-gray-700 sm:mt-6">
                                &mdash; {review.user ? review.user.userId.replace(/.(?=.{4})/g, '*') : 'Anonymous'}
                              </footer>
                            </blockquote>
                          ))}
                    </div>

                      <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
                    </form>
                  </div>
                </dialog>
              </div>

              <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
                {Array.isArray(starDetails) &&
                  starDetails.slice(0, 6).map((review, index) => (
                    <blockquote key={index} className="flex h-full flex-col justify-between bg-white p-6 shadow-sm sm:p-8">
                      <div>
                        <div className="rating">
                          {[...Array(review.rates).keys()].map((starIndex) => (
                            <input
                              key={starIndex}
                              type="radio"
                              name={`rating-${index}`}
                              className="mask mask-star-2 bg-orange-400"
                              checked
                              readOnly
                            />
                          ))}
                        </div>

                        <div className="mt-4">
                          <p className="text-2xl font-bold text-rose-600 sm:text-3xl">
                            {review.user ? review.user.username.replace(/.(?=.{4})/g, '*') : 'Anonymous'}
                          </p>

                          <p className="mt-4 leading-relaxed text-gray-700">{review.notes}</p>
                        </div>
                      </div>

                      <footer className="mt-4 text-sm font-medium text-gray-700 sm:mt-6">
                        &mdash; {review.user ? review.user.userId.replace(/.(?=.{4})/g, '*') : 'Anonymous'}
                      </footer>

                    </blockquote>
                  ))}
              </div>
            </div>
          </section>
          </div> */}
        </div>
        
      </div>
    </div>
  )
}
