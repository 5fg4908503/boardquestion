/*
Firebase Database Structure

collections/
├── questions/
│   ├── documentId: {
│   │   class: "HSC",
│   │   subject: "Physics",
│   │   paper: "1st",
│   │   year: "2023",
│   │   board: "Dhaka",
│   │   images: [
│   │     "url_to_image_1",
│   │     "url_to_image_2",
│   │     "url_to_image_3",
│   │     "url_to_image_4",
│   │     "url_to_image_5"
│   │   ],
│   │   uploadDate: timestamp
│   │ }
│   └── ...
└── subjects/
    ├── documentId: {
    │   name: "Physics",
    │   class: "HSC",
    │   group: "HSC",
    │   hasPapers: true,
    │   papers: ["1st", "2nd"]
    │ }
    └── ...
*/ 