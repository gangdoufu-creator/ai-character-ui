export const getWorkflowConfig = (type) => {
  const configs = {
    image: {
      file: "/pornscape_workflow_details.json",
      promptNode: "14",
      negativeNode: "2",
      seedNode: "3",
      batchNode: "4",
      filename: "17",
    },
    video: {
      file: "/workflow_imageToVideo.json",
      promptNode: "105",
      negativeNode: "107",
      seedNode: "108",
      imageInputNode: "164",
    },
    // Add more types as needed...
  };

  return configs[type] || configs["image"];  // fallback to 'image'
};
