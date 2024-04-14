#include <stdio.h>
#include <unistd.h>

#include <gpac/internal/isomedia_dev.h>
#include <gpac/constants.h>

extern int LLVMFuzzerTestOneInput(const uint8_t *Data, size_t Size)
{
    char fileName[256];
    char tmpDir[256];
    GF_ISOFile *isoFile;
    GF_ISOOpenMode openMode;

    // Check if input data is at least of size 1, otherwise return 0
    if (Size < 1)
    {
        return 0;
    }

    // Set the open mode based on the first byte of the input data
    openMode = (Data[0] % 2 == 0) ? GF_ISOM_OPEN_READ : GF_ISOM_OPEN_WRITE;

    // Copy the input data into fileName and tmpDir, ensuring null-termination
    size_t fileNameLen = (Size > 255) ? 255 : Size;
    memcpy(fileName, Data, fileNameLen);
    fileName[fileNameLen] = '\0';

    size_t tmpDirLen = (Size > 255) ? 255 : Size - 1;
    memcpy(tmpDir, Data + 1, tmpDirLen);
    tmpDir[tmpDirLen] = '\0';

    // Call the gf_isom_open_file function with the specified parameters
    isoFile = gf_isom_open_file(fileName, openMode, tmpDir);

    // If the file is successfully opened, close it
    if (isoFile)
    {
        gf_isom_close(isoFile);
    }

    return 0;
}