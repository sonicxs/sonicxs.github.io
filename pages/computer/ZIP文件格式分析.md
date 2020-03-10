将文件通过压缩算法减小存储或传输的体积这是压缩软件主要的初衷。压缩软件既要支持将不同的文件归档到同一文件还要将文件压缩， 常见的压缩文件格式有 .zip，.7z，.rar，.tar.gz，除了 tar.* 格式之外，其他压缩格式大多是自有的归档机制，通常压缩和归档合并在一起，而对于 tar.* 而言，先使用 tar 将文件归档，然后再使用特定的压缩算法将其压缩。不同的文件格式支持的压缩算法不同，通常如下：

|Format|Compression methods|
|:--------|:-----|
|zip | Deflate |
|7z	| LZMA, LZMA2, Bzip2, PPMd, Deflate, Zstd, Brotli |
|Rar | PPMII |
|tar.gz	| Deflate |
|tar.bz2 | Bzip2 |
|tar.xz	| LZMA/LZMA2 |
有关压缩软件的比较可以参考：[Comparison of file archivers](https://en.wikipedia.org/wiki/Comparison_of_file_archivers)

### Zip 文件格式

Zip 是一种比较悠久的压缩文件格式，文件头为 {'P','K'}，这是以 Phil Katz 的名字缩写开头，在 Windows 系统上，资源管理器默认支持打开 Zip 文件，在 Unix 系统上，可以使用 unzip 命令解压 zip 文件，zip 格式还被用于其他文件格式作为容器格式，如 Office Open XML，OpenDocument，EPUB，还有 Windows UWP appx 等均使用了 zip 格式。

Zip 格式数据布局：

![image](https://upload.wikimedia.org/wikipedia/commons/6/63/ZIP-64_Internal_Layout.svg)

Zip 通常使用 Deflate 压缩算法，解析 Zip 文件可以使用 zlib: contrib/minizip。zlib 库被非常多的软件使用，比如 git 以及 libgit2 都依赖 zlib（git 的对象压缩算法就是 Deflate）。


### 官方文档
https://pkware.cachefly.net/webdocs/APPNOTE/APPNOTE-6.2.0.txt

### 格式说明
在官方文档中给出的ZIP格式如下：

    Overall .ZIP file format:

    [local file header 1]
    [file data 1]
    [data descriptor 1]
    . 
    .
    .
    [local file header n]
    [file data n]
    [data descriptor n]
    [archive decryption header] (EFS)
    [archive extra data record] (EFS)
    [central directory]
    [zip64 end of central directory record]
    [zip64 end of central directory locator] 
    [end of central directory record]

通常情况下，我们用到的ZIP文件格式：

    [local file header + file data + data descriptor]{1,n} + central directory + end of central directory record
    即
    [文件头+文件数据+数据描述符]{此处可重复n次}+核心目录+目录结束标识
    当压缩包中有多个文件时，就会有多个[文件头+文件数据+数据描述符]

本片文章讨论的就是这种通常用到的ZIP文件格式，若想了解完整的ZIP文件格式，请看官方文档。

### 压缩源文件数据区
**[local file header + file data + data descriptor]**

记录着压缩的所有文件的内容信息，每个压缩文件都由local file header 、file data、data descriptor三部分组成，在这个数据区中每一个压缩的源文件/目录都是一条记录。

### local file header 文件头
用于标识该文件的开始，记录了该压缩文件的信息。

|Offset	|Bytes	|Description	|译|
|---|---|---|---|
|0	|4	|Local file header signature = 0x04034b50 (read as a little-endian number)|	文件头标识，值固定(0x04034b50)|
|4	|2	|Version needed to extract (minimum)	|解压文件所需 pkware最低版本|
|6	|2	|General purpose bit flag	|通用比特标志位(置比特0位=加密，详情见后)|
|8	|2	|Compression method	|压缩方式（详情见后）|
|10	|2	|File last modification time	|文件最后修改时间|
|12	|2	|File last modification date	|文件最后修改日期|
|14	|2	|CRC-32	|CRC-32校验码|
|18	|4	|Compressed size	|压缩后的大小|
|22	|4	|Uncompressed size	|未压缩的大小|
|26	|2	|File name length (n)	|文件名长度|
|28	|2	|Extra field length (m)	|扩展区长度|
|30	|n	|File name	|文件名|
|30+n	|m	|Extra field	|扩展区|

### general purpose bit flag: (2 bytes) 通用位标记

      Bit 0: If set, indicates that the file is encrypted.

      (For Method 6 - Imploding)
      Bit 1: If the compression method used was type 6,
             Imploding, then this bit, if set, indicates
             an 8K sliding dictionary was used.  If clear,
             then a 4K sliding dictionary was used.
      Bit 2: If the compression method used was type 6,
             Imploding, then this bit, if set, indicates
             3 Shannon-Fano trees were used to encode the
             sliding dictionary output.  If clear, then 2
             Shannon-Fano trees were used.

      (For Methods 8 and 9 - Deflating)
      Bit 2  Bit 1
        0      0    Normal (-en) compression option was used.
        0      1    Maximum (-exx/-ex) compression option was used.
        1      0    Fast (-ef) compression option was used.
        1      1    Super Fast (-es) compression option was used.

      Note:  Bits 1 and 2 are undefined if the compression
             method is any other.

      Bit 3: If this bit is set, the fields crc-32, compressed 
             size and uncompressed size are set to zero in the 
             local header.  The correct values are put in the 
             data descriptor immediately following the compressed
             data.  (Note: PKZIP version 2.04g for DOS only 
             recognizes this bit for method 8 compression, newer 
             versions of PKZIP recognize this bit for any 
             compression method.)

      Bit 4: Reserved for use with method 8, for enhanced
             deflating. 

      Bit 5: If this bit is set, this indicates that the file is 
             compressed patched data.  (Note: Requires PKZIP 
             version 2.70 or greater)

      Bit 6: Strong encryption.  If this bit is set, you should
             set the version needed to extract value to at least
             50 and you must also set bit 0.  If AES encryption
             is used, the version needed to extract value must 
             be at least 51.

      Bit 7: Currently unused.

      Bit 8: Currently unused.

      Bit 9: Currently unused.

      Bit 10: Currently unused.

      Bit 11: Currently unused.

      Bit 12: Reserved by PKWARE for enhanced compression.

      Bit 13: Used when encrypting the Central Directory to indicate 
              selected data values in the Local Header are masked to
              hide their actual values.  See the section describing 
              the Strong Encryption Specification for details.

      Bit 14: Reserved by PKWARE.

      Bit 15: Reserved by PKWARE.

### compression method: (2 bytes) 压缩方式
      (see accompanying documentation for algorithm
      descriptions)

      0 - The file is stored (no compression)
      1 - The file is Shrunk
      2 - The file is Reduced with compression factor 1
      3 - The file is Reduced with compression factor 2
      4 - The file is Reduced with compression factor 3
      5 - The file is Reduced with compression factor 4
      6 - The file is Imploded
      7 - Reserved for Tokenizing compression algorithm
      8 - The file is Deflated
      9 - Enhanced Deflating using Deflate64(tm)
     10 - PKWARE Data Compression Library Imploding
     11 - Reserved by PKWARE
     12 - File is compressed using BZIP2 algorithm

### file data 文件数据
记录了相应压缩文件的数据

### data descriptor 数据描述符
用于标识该文件压缩结束，该结构只有在相应的local file header中通用标记字段的第３bit设为１时才会出现，紧接在压缩文件源数据后。这个数据描述符只用在不能对输出的 ZIP 文件进行检索时使用。例如：在一个不能检索的驱动器（如：磁带机上）上的 ZIP 文件中。如果是磁盘上的ZIP文件一般没有这个数据描述符。

|Offset	| Bytes	| Description	| 译|
|----|----|----|----|
|0	|4	|crc-32	|CRC-32校验码|
|4	|4	|compressed size	压缩后的大小|
|8	|4	|uncompressed size	未压缩的大小|

### Central directory 核心目录
记录了压缩文件的目录信息，在这个数据区中每一条纪录对应在压缩源文件数据区中的一条数据。

核心目录结构如下：

|Offset	| Bytes	| Description	| 译|
|----|----|----|----|
|0	|4	|Central directory file header signature = 0x02014b50|	核心目录文件header标识=（0x02014b50）|
|4	|2	|Version made by	|压缩所用的pkware版本|
|6	|2	|Version needed to extract (minimum)	|解压所需pkware的最低版本|
|8	|2	|General purpose bit flag	|通用位标记|
|10	|2	|Compression method	|压缩方法|
|12	|2	|File last modification time	|文件最后修改时间|
|14	|2	|File last modification date	|文件最后修改日期|
|16	|4	|CRC-32	|CRC-32校验码|
|20	|4	|Compressed size	|压缩后的大小|
|24	|4	|Uncompressed size	|未压缩的大小|
|28	|2	|File name length (n)	|文件名长度|
|30	|2	|Extra field length (m)	|扩展域长度|
|32	|2	|File comment length (k)	|文件注释长度|
|34	|2	|Disk number where file starts	|文件开始位置的磁盘编号|
|36	|2	|Internal file attributes	|内部文件属性|
|38	|4	|External file attributes	|外部文件属性|
|42	|4	|relative offset of local header	|本地文件头的相对位移|
|46	|n	|File name	|目录文件名|
|46+n	|m	|Extra field	|扩展域|
|46+n+m	|k	|File comment	|文件注释内容|

### End of central directory record(EOCD) 目录结束标识
目录结束标识存在于整个归档包的结尾，用于标记压缩的目录数据的结束。每个压缩文件必须有且只有一个EOCD记录。

|Offset	| Bytes	| Description	| 译|
|----|----|----|----|
|0	|4	|End of central directory signature = 0x06054b50	|核心目录结束标记（0x06054b50）|
|4	|2	|Number of this disk	|当前磁盘编号|
|6	|2	|number of the disk with the start of the central directory|	核心目录开始位置的磁盘编号|
|8	|2|	total number of entries in the central directory on this disk|	该磁盘上所记录的核心目录数量|
|10	|2	|total number of entries in the central directory	|核心目录结构总数|
|12	|4	|Size of central directory (bytes)	|核心目录的大小|
|16	|4	|offset of start of central directory with respect to the starting disk number|	核心目录开始位置相对于archive开始的位移|
|20	|2	|.ZIP file comment length(n)	|注释长度|
|22	|n	|.ZIP Comment	|注释内容|




#### 示例
有一HiAdSDKLog.log文件，大小8166字节

    localhost:Desktop adrian_xi$ ls -l HiAdSDKLog.log 
    -rw-r--r--  1 adrian_xi  staff  8166  6  5 18:01 HiAdSDKLog.log
    
压缩成log.zip,压缩后zip大小2245.

    localhost:Desktop adrian_xi$ zip log.zip HiAdSDKLog.log 
    adding: HiAdSDKLog.log (deflated 75%)
    localhost:Desktop adrian_xi$ ls -l log.zip 
    -rw-r--r--  1 adrian_xi  staff  2245  8  8 16:48 log.zip
    
查看EOCD

    localhost:ttt adrian_xi$ tail -c 22 log.zip | hexdump -C
    00000000  50 4b 05 06 00 00 00 00  01 00 01 00 54 00 00 00  |PK..........T...|
    00000010  5b 08 00 00 00 00                                 |[.....|
    00000016
    
核心目录结束标记 0x06054b50;

该磁盘上所记录的核心目录数量 0x0001;

核心目录结构总数 0x0001;

核心目录的大小 0x00000054;

核心目录开始位置相对于archive开始的位移 0x0000085b = 2139.
2245-2139=106(即核心目录区开始于倒数106字节)

查看核心目录

    localhost:ttt adrian_xi$ tail -c 106 log.zip | hexdump -C
    00000000  50 4b 01 02 1e 03 14 00  00 00 08 00 36 90 c5 4e  |PK..........6..N|
    00000010  e1 21 10 da 13 08 00 00  e6 1f 00 00 0e 00 18 00  |.!..............|
    00000020  00 00 00 00 01 00 00 00  a4 81 00 00 00 00 48 69  |..............Hi|
    00000030  41 64 53 44 4b 4c 6f 67  2e 6c 6f 67 55 54 05 00  |AdSDKLog.logUT..|
    00000040  03 07 93 f7 5c 75 78 0b  00 01 04 f5 01 00 00 04  |....\ux.........|
    00000050  14 00 00 00 50 4b 05 06  00 00 00 00 01 00 01 00  |....PK..........|
    00000060  54 00 00 00 5b 08 00 00  00 00                    |T...[.....|
    0000006a

核心目录文件header标识 0x02014b50；

压缩所用的pkware版本 0x031e；

解压所需pkware的最低版本 0x0014;

压缩方法 0x0008 = The file is Deflated

文件最后修改时间 0x0936

文件最后修改日期 0x4e5c

CRC-32校验码 0xda1021e1

压缩后的大小 0x00000813

未压缩的大小 0x001fe6

文件名长度n 0x000e = 14

扩展域长度m 0x0018

文件注释长度k 0x0000

文件开始位置的磁盘编号 0x0000

内部文件属性 0x0001

外部文件属性 0x81a40000

本地文件头的相对位移 0x00000000

目录文件名(由前面的n得知是14位) 0x4869416453444b4c6f672e6c6f67 = HiAdSDKLog.log 这个值不小编码（little Endian）的 .

扩展域 (由前面m得知是24位) 0x55540500030793f75c75780b000104f50100000414000000

文件注释内容(由前面k得知是0位)

后面504b...就是EOCD了。

现在zip中只有一个文件，为了查看多个文件的情况，我们再zip中再加一个文件。

    localhost:ttt adrian_xi$ zip -u log.zip Push前端调研.txt 
    adding: Push前端调研.txt (deflated 43%)
    localhost:ttt adrian_xi$ ls -l log.zip 
    -rw-r--r--  1 adrian_xi  staff  3105  8  9 10:11 log.zip

我们先查看EOCD

    localhost:ttt adrian_xi$ tail -c 22 log.zip | hexdump -C
    00000000  50 4b 05 06 00 00 00 00  02 00 02 00 ae 00 00 00  |PK..............|
    00000010  5d 0b 00 00 00 00                                 |].....|
    00000016

我们看到该磁盘核心目录中的entries数量及核心目录中的entries总数量由1变成了2。
核心目录大小由0x54变成了0xae。offset由0x085b变成了0x5d0b=23819。