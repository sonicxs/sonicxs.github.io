谷歌对android系统的每个app做了内存限制，不同版本的android系统，不同的设备对每个app的内存限制可能有所不同，从早期的16M ,32M到现在的256M,384M...虽然内存增大了，但是不代表就不会出现OOM(OutOfMemory)异常，这个异常大家都懂，比如加载一些分辨率很大的图像就可能超出内存限制，所以我们在加载大图片时，还是要小心处理。

下面通过以下代码获得在Nexus_5X 5.0设备上，一个app的可用内存大小


    ActivityManager activityManager = (ActivityManager)getSystemService(Context.ACTIVITY_SERVICE);
            int memoryClass = activityManager.getMemoryClass();
            Log.d("memoryinfo","memoryClass="+memoryClass);
log：

    D/memoryinfo: memoryClass=384

 在Android3.0(Honeycomb) 有了 “largeHeap” 选项后，可以在app内存本身限定的大小内，调整到一个最大值
可以这么理解吧，在没有“largeHeap”最大内存之前，app的内存最大只能384M，超过这个值，就会出现OOM(OutOfMemory)异常，现在有“largeHeap” 这个概念，就多了一个最大值的概念，比如这个最大值512M，现在如果你在工程的AndroidManifest.xml中添加了android:largeHeap="true"，表示该应用最大内存可以调整512M了，超过了512M才会出现OOM(OutOfMemory)异常。

通过以下代码获取在Nexus_5X 5.0设备上，一个app的最大可用内存大小


    int largeMemoryClass = activityManager.getLargeMemoryClass();
            Log.d("memoryinfo","largeMemoryClass="+largeMemoryClass);

log：

    D/memoryinfo: largeMemoryClass=384

发现该设备两个最大值相等.不是所有设备都一样的
获取是否设置了largeHeap，用以下代码：

在AndroidManifest.xml中添加


    <application
            android:largeHeap="true"
------------
    Log.d("memoryinfo","isLargeHeap="+isLargeHeap(this));
------------
    private  boolean isLargeHeap(Context context) {
            return (context.getApplicationInfo().flags & ApplicationInfo.FLAG_LARGE_HEAP) != 0;
        }

log:

    D/memoryinfo: isLargeHeap=true

既然现在知道在这个设备上一个app的内存最大为384M，那么就来测试一把。

现在有一张片大小为35M左右的图片



看如下代码：

    public void click(View view){
        Log.d("BitmapFactory","click");
        BitmapFactory.Options options = new BitmapFactory.Options();
        for(int i=0;i<5;i++){
            Log.d("BitmapFactory","i="+i);
            Bitmap bitmap = BitmapFactory.decodeResource(getResources(), R.drawable.image, options);
            int bytes = bitmap.getAllocationByteCount();//Returns the size of the allocated memory used to store this bitmap's pixels.
            Log.d("BitmapFactory","bytes="+bytes);
            list.add(bitmap);
        }
    }

现在点击button，就添加该图片添加到集合中，先设置了添加5次，结果程序崩溃了，看log:

    D/BitmapFactory: click
    D/BitmapFactory: i=0
    I/art: Alloc partial concurrent mark sweep GC freed 405(25KB) AllocSpace objects, 1(255MB) LOS objects, 40% free, 1755KB/2MB, paused 101us total 10.729ms
    D/BitmapFactory: bytes=267845760
    D/BitmapFactory: i=1
    I/art: Forcing collection of SoftReferences for 255MB allocation
    E/art: Throwing OutOfMemoryError "Failed to allocate a 267845772 byte allocation with 4194304 free bytes and 127MB until OOM"
    D/skia: --- allocation failed for scaled bitmap
    D/AndroidRuntime: Shutting down VM
    E/AndroidRuntime: FATAL EXCEPTION: main
                      Process: cj.com.bitmapfactory, PID: 4180
                      java.lang.IllegalStateException: Could not execute method for android:onClick
                          at android.support.v7.app.AppCompatViewInflater$DeclaredOnClickListener.onClick(AppCompatViewInflater.java:293)
                          at android.view.View.performClick(View.java:4756)
                          at android.view.View$PerformClick.run(View.java:19749)
                          at android.os.Handler.handleCallback(Handler.java:739)
                          at android.os.Handler.dispatchMessage(Handler.java:95)
                          at android.os.Looper.loop(Looper.java:135)
                          at android.app.ActivityThread.main(ActivityThread.java:5221)
                          at java.lang.reflect.Method.invoke(Native Method)
                          at java.lang.reflect.Method.invoke(Method.java:372)
                          at com.android.internal.os.ZygoteInit$MethodAndArgsCaller.run(ZygoteInit.java:899)
                          at com.android.internal.os.ZygoteInit.main(ZygoteInit.java:694)
                       Caused by: java.lang.reflect.InvocationTargetException
                          at java.lang.reflect.Method.invoke(Native Method)
                          at java.lang.reflect.Method.invoke(Method.java:372)
                          at android.support.v7.app.AppCompatViewInflater$DeclaredOnClickListener.onClick(AppCompatViewInflater.java:288)
                          at android.view.View.performClick(View.java:4756) 
                          at android.view.View$PerformClick.run(View.java:19749) 
                          at android.os.Handler.handleCallback(Handler.java:739) 
                          at android.os.Handler.dispatchMessage(Handler.java:95) 
                          at android.os.Looper.loop(Looper.java:135) 
                          at android.app.ActivityThread.main(ActivityThread.java:5221) 
                          at java.lang.reflect.Method.invoke(Native Method) 
                          at java.lang.reflect.Method.invoke(Method.java:372) 
                          at com.android.internal.os.ZygoteInit$MethodAndArgsCaller.run(ZygoteInit.java:899) 
                          at com.android.internal.os.ZygoteInit.main(ZygoteInit.java:694) 
                       Caused by: java.lang.OutOfMemoryError: Failed to allocate a 267845772 byte allocation with 4194304 free bytes and 127MB until OOM
                          at dalvik.system.VMRuntime.newNonMovableArray(Native Method)
                          at android.graphics.BitmapFactory.nativeDecodeAsset(Native Method)
                          at android.graphics.BitmapFactory.decodeStream(BitmapFactory.java:609)
                          at android.graphics.BitmapFactory.decodeResourceStream(BitmapFactory.java:444)
                          at android.graphics.BitmapFactory.decodeResource(BitmapFactory.java:467)
                          at cj.com.bitmapfactory.MainActivity$override.click(MainActivity.java:31)
                          at cj.com.bitmapfactory.MainActivity$override.access$dispatch(MainActivity.java)
                          at cj.com.bitmapfactory.MainActivity.click(MainActivity.java:0)
                          at java.lang.reflect.Method.invoke(Native Method) 
                          at java.lang.reflect.Method.invoke(Method.java:372) 
                          at android.support.v7.app.AppCompatViewInflater$DeclaredOnClickListener.onClick(AppCompatViewInflater.java:288) 
                          at android.view.View.performClick(View.java:4756) 
                          at android.view.View$PerformClick.run(View.java:19749) 
                          at android.os.Handler.handleCallback(Handler.java:739) 
                          at android.os.Handler.dispatchMessage(Handler.java:95) 
                          at android.os.Looper.loop(Looper.java:135) 
                          at android.app.ActivityThread.main(ActivityThread.java:5221) 
                          at java.lang.reflect.Method.invoke(Native Method) 
                          at java.lang.reflect.Method.invoke(Method.java:372) 
                          at com.android.internal.os.ZygoteInit$MethodAndArgsCaller.run(ZygoteInit.java:899) 
                          at com.android.internal.os.ZygoteInit.main(ZygoteInit.java:694) 
    I/Process: Sending signal. PID: 4180 SIG: 9

没错出现OOM异常，通过log发现应该是在第二次添加图片的时候发生了内存溢出。

    int bytes = bitmap.getAllocationByteCount();
    
这个方法是获取存储该张图片开辟的内存大小
一共267845760字节，也就是255.43762207M左右，这就是为什么添加第二张的时候就出现内存溢出了，两张加起来就大于384M了。

但是是不是很奇怪，这张图片本身就35M左右啊，怎么应用给开辟了255M左右的内存呢？？

    Bitmap bitmap = BitmapFactory.decodeResource(getResources(), R.drawable.image, options);
答案在这个方法里。
解码资源文件获取的位图经过了缩放。缩放的依据是根据设备屏幕的密度来的，当前该设备的密度是：420DPI



放大的倍数就是420/160,160就默认的标准密度，这样以来图片的宽高都放大了420/160倍，所以最终图片的大小差不多就是34.9×（420/160）×（420/160）结果大小就差不多250M了

可见虽然内存大小有348M，但是在加载大图片时，也很容易出现OOM异常，所以需要我们在解码图片资源的时候要对大的图片进行缩小。

下面就接着讲一下高效加载大图片的API

官方文档：

https://developer.android.com/training/displaying-bitmaps/index.html

https://developer.android.com/training/displaying-bitmaps/load-bitmap.html

这里就来缩小上边那张35M的大图片：

代码如下：

    public void click(View view){
        Log.d("BitmapFactory","click");
        Bitmap bitmap = decodeSampledBitmapFromResource(getResources(), R.drawable.image, 100, 100);
        int byteCount = bitmap.getAllocationByteCount();
        Log.d("BitmapFactory","byteCount="+byteCount);
    }

还是去解码那张大图片，只不过现在我有要求了，要求经过处理的图片的宽高都是100，然后再打印一下程序为该图片分配的内存大小

原图的宽高：



很大吧


    private Bitmap decodeSampledBitmapFromResource(Resources res , int resId, int targetWidth, int tartgetHegiht){
    // First decode with inJustDecodeBounds=true to check dimensions
        final BitmapFactory.Options options = new BitmapFactory.Options();
        /**
         * If set to true, the decoder will return null (no bitmap), but
         * the out... fields will still be set, allowing the caller to query
         * the bitmap without having to allocate the memory for its pixels.
         */
        options.inJustDecodeBounds = true;
        Bitmap bitmap = BitmapFactory.decodeResource(res, resId, options);
        Log.d("BitmapFactory",bitmap+"");
 
        // Calculate inSampleSize
        options.inSampleSize = calculateInSampleSize(options, targetWidth, tartgetHegiht);
 
        // Decode bitmap with inSampleSize set
        options.inJustDecodeBounds = false;
 
        Bitmap bitmap2 = BitmapFactory.decodeResource(res, resId, options);
        Log.d("BitmapFactory",bitmap2+"");
        Log.d("BitmapFactory","bitmap2 height ="+bitmap2.getHeight()+"  width=="+bitmap2.getWidth());
        return  bitmap2;
    }

解码图片资源还是用BitmapFactory这个工具
该工具介绍

https://developer.android.com/reference/android/graphics/BitmapFactory.html

BitmapFactory结合这个BitmapFactory.Options来处理图片，首先是获取原始图片的大小，只要设置

    options.inJustDecodeBounds = true;
    BitmapFactory.decodeResource(res, resId, options);
    
暂时不会分配内存，只是查看图片信息，所以返回的位图为null。
然后通图片原始大小和期待的大小，算出一下缩小的比例：

    private int calculateInSampleSize(
            BitmapFactory.Options options, int reqWidth, int reqHeight) {
        // Raw height and width of image
        final int height = options.outHeight;
        final int width = options.outWidth;
        String imageType = options.outMimeType;
 
        Log.d("BitmapFactory","Raw height ="+height+"  width=="+width);
        Log.d("BitmapFactory","options.outMimeType ="+imageType);
        /**
         * If set to a value > 1, requests the decoder to subsample the original
         * image, returning a smaller image to save memory. The sample size is
         * the number of pixels in either dimension that correspond to a single
         * pixel in the decoded bitmap. For example, inSampleSize == 4 returns
         * an image that is 1/4 the width/height of the original, and 1/16 the
         * number of pixels. Any value <= 1 is treated the same as 1. Note: the
         * decoder will try to fulfill this request, but the resulting bitmap
         * may have different dimensions that precisely what has been requested.
         * Also, powers of 2 are often faster/easier for the decoder to honor.
         */
        int inSampleSize = 1;
 
        if (height > reqHeight || width > reqWidth) {
            final int halfHeight = height / 2;
            final int halfWidth = width / 2;
 
            // Calculate the largest inSampleSize value that is a power of 2 and keeps both
            // height and width larger than the requested height and width.
            while ((halfHeight / inSampleSize) >= reqHeight
                    && (halfWidth / inSampleSize) >= reqWidth) {
                inSampleSize *= 2;
            }
        }
        Log.d("BitmapFactory","inSampleSize ="+inSampleSize);
        return inSampleSize;
    }

缩小的倍数就是2的多少次方，比如1,2,4,8...,
比如期待100*100，原始是480*800，那就是以小的值480为标准，缩小到接近100，但大于100，算出缩小倍数是4，缩小后的大小就是120*200了。
将缩小的比例值的赋值给

    options.inSampleSize
然后再设置：

    // Decode bitmap with inSampleSize set
    options.inJustDecodeBounds = false;
重新解码图片资源，最好获取的位图就是缩小的了
看一下log:

    D/BitmapFactory: click
    D/BitmapFactory: null
    D/BitmapFactory: Raw height =4160  width==2336
    D/BitmapFactory: options.outMimeType =image/jpeg
    D/BitmapFactory: inSampleSize =16
    D/BitmapFactory: android.graphics.Bitmap@2c6cbd5d
    D/BitmapFactory: bitmap2 height =683  width==383
    D/BitmapFactory: byteCount=1046356

图片的宽高都缩放了16倍，咦，不对呀 4160/16 不等于683呀，这还是上面提到的，处理的图片还要根据屏幕密度（dpi）来适配设备，所以又放大了420/160倍，可以算一下就知道了。最终获取的图片的大小是1046356字节，大概1M左右。
因此为了防止OOM异常，有时候对图片的的缩小还是有必要的，图片的显示还要结合UI控件来。
--------------------- 

原文：https://blog.csdn.net/hehe26/article/details/52839074 
