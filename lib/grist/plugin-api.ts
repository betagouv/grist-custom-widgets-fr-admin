//Set up Grist with acces required and columns to map
interface Column {
  name: string;
  title: string;
  type: string;
  optional: boolean;
}

export const gristReady = (access: string, columns: Column[]) => {
  grist.ready({
    requiredAccess: access,
    columns: columns,
  });
};

// Update record with the patch object
export const addObjectInRecord = (recordId: number, patch: grist.RowRecord) => {
  grist
    .getTable()
    .getTableId()
    .then((tableId) => {
      grist.docApi
        .applyUserActions([["UpdateRecord", tableId, recordId, patch]])
        .then(() => {
          console.log("Record successfully updated");
        })
        .catch((err) => {
          console.error("Failed to update record", err);
        });
    })
    .catch((err) => {
      console.error("Failed to get table ID", err);
    });
};
