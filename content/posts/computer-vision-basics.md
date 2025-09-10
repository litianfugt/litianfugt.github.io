---
title: "计算机视觉基础：从像素到理解"
date: 2023-10-20T10:45:00+08:00
draft: false
description: "本文全面介绍了计算机视觉的基础知识，从图像表示、基本处理到高级特征提取和目标检测，帮助读者理解计算机如何看懂图像。"
keywords: ["计算机视觉", "图像处理", "特征提取", "目标检测", "深度学习"]
tags: ["计算机视觉", "图像处理", "人工智能"]
categories: ["技术分享"]
author: "李石原"
showToc: true
hidemeta: false
disableShare: false
disableHLJS: false
hideSummary: false
searchHidden: false
ShowReadingTime: true
ShowBreadCrumbs: true
ShowPostNavLinks: true
ShowWordCount: true
ShowRssButtonInSectionTermList: true
UseHugoToc: true
cover:
    image: "/images/computer-vision-basics.jpg"
    alt: "计算机视觉基础"
    caption: "探索计算机如何理解图像世界"
    relative: false
---

# 计算机视觉基础：从像素到理解

计算机视觉是人工智能领域的一个重要分支，它致力于让计算机能够从图像或视频中获取信息、理解内容并做出决策。从简单的图像处理到复杂的场景理解，计算机视觉技术已经广泛应用于医疗诊断、自动驾驶、安防监控、人脸识别等众多领域。本文将全面介绍计算机视觉的基础知识，帮助读者理解计算机如何"看懂"图像。

## 图像基础

### 图像表示

#### 数字图像的概念

数字图像是由有限数量的像素（Picture Element，简称Pixel）组成的二维矩阵。每个像素代表图像中的一个点，具有特定的位置和值。

```python
import numpy as np
import matplotlib.pyplot as plt

# 创建一个简单的灰度图像
# 5x5的灰度图像，值范围0-255
gray_image = np.array([
    [0, 50, 100, 150, 200],
    [30, 80, 130, 180, 230],
    [60, 110, 160, 210, 240],
    [90, 140, 190, 220, 250],
    [120, 170, 200, 230, 255]
], dtype=np.uint8)

# 显示图像
plt.imshow(gray_image, cmap='gray')
plt.title('Grayscale Image')
plt.colorbar()
plt.show()
```

#### 彩色图像表示

彩色图像通常使用RGB（红、绿、蓝）三个通道来表示。每个像素由三个值组成，分别代表红、绿、蓝三个颜色通道的强度。

```python
# 创建一个简单的彩色图像
# 5x5x3的RGB图像，值范围0-255
color_image = np.zeros((5, 5, 3), dtype=np.uint8)

# 设置红色通道
color_image[:, :, 0] = np.array([
    [255, 200, 150, 100, 50],
    [230, 180, 130, 80, 30],
    [210, 160, 110, 60, 10],
    [190, 140, 90, 40, 0],
    [170, 120, 70, 20, 0]
])

# 设置绿色通道
color_image[:, :, 1] = np.array([
    [0, 50, 100, 150, 200],
    [30, 80, 130, 180, 230],
    [60, 110, 160, 210, 240],
    [90, 140, 190, 220, 250],
    [120, 170, 200, 230, 255]
])

# 设置蓝色通道
color_image[:, :, 2] = np.array([
    [0, 30, 60, 90, 120],
    [50, 80, 110, 140, 170],
    [100, 130, 160, 190, 200],
    [150, 180, 210, 220, 230],
    [200, 230, 240, 250, 255]
])

# 显示图像
plt.imshow(color_image)
plt.title('Color Image')
plt.show()
```

#### 其他颜色空间

除了RGB，还有其他常用的颜色空间，如HSV（色相、饱和度、明度）和Lab（亮度、a通道、b通道）。

```python
import cv2

# 将RGB图像转换为HSV颜色空间
hsv_image = cv2.cvtColor(color_image, cv2.COLOR_RGB2HSV)

# 将RGB图像转换为Lab颜色空间
lab_image = cv2.cvtColor(color_image, cv2.COLOR_RGB2Lab)

# 显示不同颜色空间的图像
plt.figure(figsize=(15, 5))

plt.subplot(1, 3, 1)
plt.imshow(color_image)
plt.title('RGB Image')

plt.subplot(1, 3, 2)
plt.imshow(hsv_image)
plt.title('HSV Image')

plt.subplot(1, 3, 3)
plt.imshow(lab_image)
plt.title('Lab Image')

plt.tight_layout()
plt.show()
```

### 图像属性

#### 分辨率

图像分辨率是指图像中像素的数量，通常表示为宽度×高度（如1920×1080）。高分辨率图像包含更多细节，但也需要更多的存储空间和处理时间。

```python
# 获取图像分辨率
height, width = gray_image.shape
print(f"灰度图像分辨率: {width}x{height}")

height, width, channels = color_image.shape
print(f"彩色图像分辨率: {width}x{height}, 通道数: {channels}")
```

#### 位深度

位深度是指每个像素使用的位数，决定了图像可以表示的颜色数量。常见的位深度有8位（256个灰度级）、24位（RGB各8位，约1670万种颜色）等。

```python
# 检查图像的位深度
print(f"灰度图像数据类型: {gray_image.dtype}")
print(f"彩色图像数据类型: {color_image.dtype}")

# 计算可以表示的颜色数量
gray_levels = 2 ** (gray_image.itemsize * 8)
color_levels = 2 ** (color_image.itemsize * 8)

print(f"灰度图像可以表示的灰度级数: {gray_levels}")
print(f"彩色图像每个通道可以表示的颜色级数: {color_levels}")
```

## 图像基本处理

### 图像读取与显示

#### 使用OpenCV读取图像

OpenCV是一个广泛使用的计算机视觉库，提供了丰富的图像处理功能。

```python
import cv2

# 读取图像
# 注意：OpenCV默认以BGR格式读取彩色图像
image_bgr = cv2.imread('example.jpg')

# 检查图像是否成功读取
if image_bgr is None:
    print("无法读取图像")
else:
    # 转换为RGB格式以便正确显示
    image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
    
    # 显示图像
    plt.imshow(image_rgb)
    plt.title('Image')
    plt.axis('off')  # 不显示坐标轴
    plt.show()
```

#### 使用PIL/Pillow读取图像

Pillow是Python图像处理库，提供了简单易用的图像处理功能。

```python
from PIL import Image

# 读取图像
image = Image.open('example.jpg')

# 显示图像
image.show()

# 转换为numpy数组
image_array = np.array(image)

# 显示图像信息
print(f"图像大小: {image.size}")
print(f"图像模式: {image.mode}")
print(f"图像数组形状: {image_array.shape}")
```

### 图像基本操作

#### 裁剪图像

```python
# 裁剪图像 (y1:y2, x1:x2)
cropped_image = image_rgb[50:200, 100:300]

# 显示裁剪后的图像
plt.imshow(cropped_image)
plt.title('Cropped Image')
plt.axis('off')
plt.show()
```

#### 调整图像大小

```python
# 使用OpenCV调整图像大小
resized_cv2 = cv2.resize(image_rgb, (300, 200))

# 使用PIL调整图像大小
resized_pil = Image.fromarray(image_rgb).resize((300, 200))

# 显示调整大小后的图像
plt.figure(figsize=(10, 5))

plt.subplot(1, 2, 1)
plt.imshow(resized_cv2)
plt.title('Resized with OpenCV')
plt.axis('off')

plt.subplot(1, 2, 2)
plt.imshow(resized_pil)
plt.title('Resized with PIL')
plt.axis('off')

plt.tight_layout()
plt.show()
```

#### 旋转图像

```python
# 使用OpenCV旋转图像
(h, w) = image_rgb.shape[:2]
center = (w // 2, h // 2)
M = cv2.getRotationMatrix2D(center, 45, 1.0)
rotated_cv2 = cv2.warpAffine(image_rgb, M, (w, h))

# 使用PIL旋转图像
rotated_pil = Image.fromarray(image_rgb).rotate(45)

# 显示旋转后的图像
plt.figure(figsize=(10, 5))

plt.subplot(1, 2, 1)
plt.imshow(rotated_cv2)
plt.title('Rotated with OpenCV')
plt.axis('off')

plt.subplot(1, 2, 2)
plt.imshow(rotated_pil)
plt.title('Rotated with PIL')
plt.axis('off')

plt.tight_layout()
plt.show()
```

#### 翻转图像

```python
# 水平翻转
flipped_h = cv2.flip(image_rgb, 1)

# 垂直翻转
flipped_v = cv2.flip(image_rgb, 0)

# 水平和垂直翻转
flipped_hv = cv2.flip(image_rgb, -1)

# 显示翻转后的图像
plt.figure(figsize=(15, 5))

plt.subplot(1, 3, 1)
plt.imshow(flipped_h)
plt.title('Horizontal Flip')
plt.axis('off')

plt.subplot(1, 3, 2)
plt.imshow(flipped_v)
plt.title('Vertical Flip')
plt.axis('off')

plt.subplot(1, 3, 3)
plt.imshow(flipped_hv)
plt.title('Horizontal and Vertical Flip')
plt.axis('off')

plt.tight_layout()
plt.show()
```

## 图像增强

### 亮度调整

```python
# 增加亮度
brightness_increase = cv2.convertScaleAbs(image_rgb, alpha=1.2, beta=50)

# 减少亮度
brightness_decrease = cv2.convertScaleAbs(image_rgb, alpha=1.0, beta=-50)

# 显示亮度调整后的图像
plt.figure(figsize=(15, 5))

plt.subplot(1, 3, 1)
plt.imshow(image_rgb)
plt.title('Original Image')
plt.axis('off')

plt.subplot(1, 3, 2)
plt.imshow(brightness_increase)
plt.title('Increased Brightness')
plt.axis('off')

plt.subplot(1, 3, 3)
plt.imshow(brightness_decrease)
plt.title('Decreased Brightness')
plt.axis('off')

plt.tight_layout()
plt.show()
```

### 对比度调整

```python
# 增加对比度
contrast_increase = cv2.convertScaleAbs(image_rgb, alpha=1.5, beta=0)

# 减少对比度
contrast_decrease = cv2.convertScaleAbs(image_rgb, alpha=0.5, beta=0)

# 显示对比度调整后的图像
plt.figure(figsize=(15, 5))

plt.subplot(1, 3, 1)
plt.imshow(image_rgb)
plt.title('Original Image')
plt.axis('off')

plt.subplot(1, 3, 2)
plt.imshow(contrast_increase)
plt.title('Increased Contrast')
plt.axis('off')

plt.subplot(1, 3, 3)
plt.imshow(contrast_decrease)
plt.title('Decreased Contrast')
plt.axis('off')

plt.tight_layout()
plt.show()
```

### 直方图均衡化

```python
# 转换为灰度图像
gray_image = cv2.cvtColor(image_rgb, cv2.COLOR_RGB2GRAY)

# 直方图均衡化
equalized_image = cv2.equalizeHist(gray_image)

# 显示直方图均衡化前后的图像和直方图
plt.figure(figsize=(15, 10))

# 原始图像
plt.subplot(2, 2, 1)
plt.imshow(gray_image, cmap='gray')
plt.title('Original Grayscale Image')
plt.axis('off')

# 均衡化后的图像
plt.subplot(2, 2, 2)
plt.imshow(equalized_image, cmap='gray')
plt.title('Equalized Image')
plt.axis('off')

# 原始直方图
plt.subplot(2, 2, 3)
plt.hist(gray_image.ravel(), 256, [0, 256])
plt.title('Original Histogram')

# 均衡化后的直方图
plt.subplot(2, 2, 4)
plt.hist(equalized_image.ravel(), 256, [0, 256])
plt.title('Equalized Histogram')

plt.tight_layout()
plt.show()
```

### 伽马校正

```python
def adjust_gamma(image, gamma=1.0):
    # 构建查找表
    inv_gamma = 1.0 / gamma
    table = np.array([((i / 255.0) ** inv_gamma) * 255
        for i in np.arange(0, 256)]).astype("uint8")
    
    # 应用伽马校正
    return cv2.LUT(image, table)

# 应用不同的伽马值
gamma_1_5 = adjust_gamma(image_rgb, 1.5)
gamma_0_5 = adjust_gamma(image_rgb, 0.5)

# 显示伽马校正后的图像
plt.figure(figsize=(15, 5))

plt.subplot(1, 3, 1)
plt.imshow(image_rgb)
plt.title('Original Image (γ=1.0)')
plt.axis('off')

plt.subplot(1, 3, 2)
plt.imshow(gamma_1_5)
plt.title('Gamma=1.5')
plt.axis('off')

plt.subplot(1, 3, 3)
plt.imshow(gamma_0_5)
plt.title('Gamma=0.5')
plt.axis('off')

plt.tight_layout()
plt.show()
```

## 图像滤波

### 均值滤波

```python
# 转换为灰度图像
gray_image = cv2.cvtColor(image_rgb, cv2.COLOR_RGB2GRAY)

# 应用不同大小的均值滤波
blur_3x3 = cv2.blur(gray_image, (3, 3))
blur_5x5 = cv2.blur(gray_image, (5, 5))
blur_7x7 = cv2.blur(gray_image, (7, 7))

# 显示均值滤波后的图像
plt.figure(figsize=(15, 10))

plt.subplot(2, 2, 1)
plt.imshow(gray_image, cmap='gray')
plt.title('Original Image')
plt.axis('off')

plt.subplot(2, 2, 2)
plt.imshow(blur_3x3, cmap='gray')
plt.title('3x3 Mean Filter')
plt.axis('off')

plt.subplot(2, 2, 3)
plt.imshow(blur_5x5, cmap='gray')
plt.title('5x5 Mean Filter')
plt.axis('off')

plt.subplot(2, 2, 4)
plt.imshow(blur_7x7, cmap='gray')
plt.title('7x7 Mean Filter')
plt.axis('off')

plt.tight_layout()
plt.show()
```

### 高斯滤波

```python
# 应用不同大小和标准差的高斯滤波
gaussian_3x3 = cv2.GaussianBlur(gray_image, (3, 3), 0)
gaussian_5x5 = cv2.GaussianBlur(gray_image, (5, 5), 0)
gaussian_7x7 = cv2.GaussianBlur(gray_image, (7, 7), 0)

# 显示高斯滤波后的图像
plt.figure(figsize=(15, 10))

plt.subplot(2, 2, 1)
plt.imshow(gray_image, cmap='gray')
plt.title('Original Image')
plt.axis('off')

plt.subplot(2, 2, 2)
plt.imshow(gaussian_3x3, cmap='gray')
plt.title('3x3 Gaussian Filter')
plt.axis('off')

plt.subplot(2, 2, 3)
plt.imshow(gaussian_5x5, cmap='gray')
plt.title('5x5 Gaussian Filter')
plt.axis('off')

plt.subplot(2, 2, 4)
plt.imshow(gaussian_7x7, cmap='gray')
plt.title('7x7 Gaussian Filter')
plt.axis('off')

plt.tight_layout()
plt.show()
```

### 中值滤波

```python
# 应用不同大小的中值滤波
median_3 = cv2.medianBlur(gray_image, 3)
median_5 = cv2.medianBlur(gray_image, 5)
median_7 = cv2.medianBlur(gray_image, 7)

# 显示中值滤波后的图像
plt.figure(figsize=(15, 10))

plt.subplot(2, 2, 1)
plt.imshow(gray_image, cmap='gray')
plt.title('Original Image')
plt.axis('off')

plt.subplot(2, 2, 2)
plt.imshow(median_3, cmap='gray')
plt.title('3x3 Median Filter')
plt.axis('off')

plt.subplot(2, 2, 3)
plt.imshow(median_5, cmap='gray')
plt.title('5x5 Median Filter')
plt.axis('off')

plt.subplot(2, 2, 4)
plt.imshow(median_7, cmap='gray')
plt.title('7x7 Median Filter')
plt.axis('off')

plt.tight_layout()
plt.show()
```

### 双边滤波

```python
# 应用双边滤波
bilateral = cv2.bilateralFilter(gray_image, 9, 75, 75)

# 显示双边滤波后的图像
plt.figure(figsize=(15, 5))

plt.subplot(1, 2, 1)
plt.imshow(gray_image, cmap='gray')
plt.title('Original Image')
plt.axis('off')

plt.subplot(1, 2, 2)
plt.imshow(bilateral, cmap='gray')
plt.title('Bilateral Filter')
plt.axis('off')

plt.tight_layout()
plt.show()
```

## 边缘检测

### Sobel算子

```python
# 应用Sobel算子
sobel_x = cv2.Sobel(gray_image, cv2.CV_64F, 1, 0, ksize=3)
sobel_y = cv2.Sobel(gray_image, cv2.CV_64F, 0, 1, ksize=3)
sobel_xy = cv2.Sobel(gray_image, cv2.CV_64F, 1, 1, ksize=3)

# 转换回uint8
sobel_x = cv2.convertScaleAbs(sobel_x)
sobel_y = cv2.convertScaleAbs(sobel_y)
sobel_xy = cv2.convertScaleAbs(sobel_xy)

# 显示Sobel边缘检测结果
plt.figure(figsize=(15, 10))

plt.subplot(2, 2, 1)
plt.imshow(gray_image, cmap='gray')
plt.title('Original Image')
plt.axis('off')

plt.subplot(2, 2, 2)
plt.imshow(sobel_x, cmap='gray')
plt.title('Sobel X')
plt.axis('off')

plt.subplot(2, 2, 3)
plt.imshow(sobel_y, cmap='gray')
plt.title('Sobel Y')
plt.axis('off')

plt.subplot(2, 2, 4)
plt.imshow(sobel_xy, cmap='gray')
plt.title('Sobel XY')
plt.axis('off')

plt.tight_layout()
plt.show()
```

### Laplacian算子

```python
# 应用Laplacian算子
laplacian = cv2.Laplacian(gray_image, cv2.CV_64F)
laplacian = cv2.convertScaleAbs(laplacian)

# 显示Laplacian边缘检测结果
plt.figure(figsize=(15, 5))

plt.subplot(1, 2, 1)
plt.imshow(gray_image, cmap='gray')
plt.title('Original Image')
plt.axis('off')

plt.subplot(1, 2, 2)
plt.imshow(laplacian, cmap='gray')
plt.title('Laplacian Edge Detection')
plt.axis('off')

plt.tight_layout()
plt.show()
```

### Canny边缘检测

```python
# 应用Canny边缘检测
canny_low = cv2.Canny(gray_image, 50, 150)
canny_high = cv2.Canny(gray_image, 100, 200)

# 显示Canny边缘检测结果
plt.figure(figsize=(15, 5))

plt.subplot(1, 3, 1)
plt.imshow(gray_image, cmap='gray')
plt.title('Original Image')
plt.axis('off')

plt.subplot(1, 3, 2)
plt.imshow(canny_low, cmap='gray')
plt.title('Canny (50, 150)')
plt.axis('off')

plt.subplot(1, 3, 3)
plt.imshow(canny_high, cmap='gray')
plt.title('Canny (100, 200)')
plt.axis('off')

plt.tight_layout()
plt.show()
```

## 图像分割

### 阈值分割

```python
# 应用不同类型的阈值分割
ret, thresh_binary = cv2.threshold(gray_image, 127, 255, cv2.THRESH_BINARY)
ret, thresh_binary_inv = cv2.threshold(gray_image, 127, 255, cv2.THRESH_BINARY_INV)
ret, thresh_trunc = cv2.threshold(gray_image, 127, 255, cv2.THRESH_TRUNC)
ret, thresh_tozero = cv2.threshold(gray_image, 127, 255, cv2.THRESH_TOZERO)
ret, thresh_tozero_inv = cv2.threshold(gray_image, 127, 255, cv2.THRESH_TOZERO_INV)

# 显示阈值分割结果
plt.figure(figsize=(15, 10))

plt.subplot(2, 3, 1)
plt.imshow(gray_image, cmap='gray')
plt.title('Original Image')
plt.axis('off')

plt.subplot(2, 3, 2)
plt.imshow(thresh_binary, cmap='gray')
plt.title('Binary Threshold')
plt.axis('off')

plt.subplot(2, 3, 3)
plt.imshow(thresh_binary_inv, cmap='gray')
plt.title('Binary Inverted Threshold')
plt.axis('off')

plt.subplot(2, 3, 4)
plt.imshow(thresh_trunc, cmap='gray')
plt.title('Truncated Threshold')
plt.axis('off')

plt.subplot(2, 3, 5)
plt.imshow(thresh_tozero, cmap='gray')
plt.title('To Zero Threshold')
plt.axis('off')

plt.subplot(2, 3, 6)
plt.imshow(thresh_tozero_inv, cmap='gray')
plt.title('To Zero Inverted Threshold')
plt.axis('off')

plt.tight_layout()
plt.show()
```

### 自适应阈值分割

```python
# 应用自适应阈值分割
adaptive_mean = cv2.adaptiveThreshold(gray_image, 255, cv2.ADAPTIVE_THRESH_MEAN_C, cv2.THRESH_BINARY, 11, 2)
adaptive_gaussian = cv2.adaptiveThreshold(gray_image, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)

# 显示自适应阈值分割结果
plt.figure(figsize=(15, 5))

plt.subplot(1, 3, 1)
plt.imshow(gray_image, cmap='gray')
plt.title('Original Image')
plt.axis('off')

plt.subplot(1, 3, 2)
plt.imshow(adaptive_mean, cmap='gray')
plt.title('Adaptive Mean Threshold')
plt.axis('off')

plt.subplot(1, 3, 3)
plt.imshow(adaptive_gaussian, cmap='gray')
plt.title('Adaptive Gaussian Threshold')
plt.axis('off')

plt.tight_layout()
plt.show()
```

### Otsu阈值分割

```python
# 应用Otsu阈值分割
ret, otsu = cv2.threshold(gray_image, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

# 显示Otsu阈值分割结果
plt.figure(figsize=(15, 5))

plt.subplot(1, 2, 1)
plt.imshow(gray_image, cmap='gray')
plt.title('Original Image')
plt.axis('off')

plt.subplot(1, 2, 2)
plt.imshow(otsu, cmap='gray')
plt.title(f'Otsu Threshold (Threshold={ret})')
plt.axis('off')

plt.tight_layout()
plt.show()
```

### 分水岭算法

```python
# 创建一个简单的二值图像
binary_image = np.zeros((300, 300), dtype=np.uint8)
cv2.circle(binary_image, (100, 100), 50, 255, -1)
cv2.circle(binary_image, (200, 200), 50, 255, -1)

# 应用距离变换
dist_transform = cv2.distanceTransform(binary_image, cv2.DIST_L2, 5)
ret, sure_fg = cv2.threshold(dist_transform, 0.7 * dist_transform.max(), 255, 0)
sure_fg = np.uint8(sure_fg)

# 未知区域
unknown = cv2.subtract(binary_image, sure_fg)

# 标记标签
ret, markers = cv2.connectedComponents(sure_fg)
markers = markers + 1
markers[unknown == 255] = 0

# 应用分水岭算法
markers = cv2.watershed(cv2.cvtColor(binary_image, cv2.COLOR_GRAY2BGR), markers)

# 显示分水岭算法结果
plt.figure(figsize=(15, 5))

plt.subplot(1, 3, 1)
plt.imshow(binary_image, cmap='gray')
plt.title('Binary Image')
plt.axis('off')

plt.subplot(1, 3, 2)
plt.imshow(dist_transform, cmap='gray')
plt.title('Distance Transform')
plt.axis('off')

plt.subplot(1, 3, 3)
plt.imshow(markers, cmap='jet')
plt.title('Watershed Segmentation')
plt.axis('off')

plt.tight_layout()
plt.show()
```

## 特征提取

### Harris角点检测

```python
# 应用Harris角点检测
gray_float = np.float32(gray_image)
harris_corners = cv2.cornerHarris(gray_float, 2, 3, 0.04)

# 扩大角点标记
harris_corners = cv2.dilate(harris_corners, None)

# 设置阈值
threshold = 0.01 * harris_corners.max()
corner_image = image_rgb.copy()
corner_image[harris_corners > threshold] = [255, 0, 0]

# 显示Harris角点检测结果
plt.figure(figsize=(15, 5))

plt.subplot(1, 2, 1)
plt.imshow(image_rgb)
plt.title('Original Image')
plt.axis('off')

plt.subplot(1, 2, 2)
plt.imshow(corner_image)
plt.title('Harris Corner Detection')
plt.axis('off')

plt.tight_layout()
plt.show()
```

### Shi-Tomasi角点检测

```python
# 应用Shi-Tomasi角点检测
corners = cv2.goodFeaturesToTrack(gray_image, 100, 0.01, 10)
corners = np.int0(corners)

# 绘制角点
shi_tomasi_image = image_rgb.copy()
for corner in corners:
    x, y = corner.ravel()
    cv2.circle(shi_tomasi_image, (x, y), 3, 255, -1)

# 显示Shi-Tomasi角点检测结果
plt.figure(figsize=(15, 5))

plt.subplot(1, 2, 1)
plt.imshow(image_rgb)
plt.title('Original Image')
plt.axis('off')

plt.subplot(1, 2, 2)
plt.imshow(shi_tomasi_image)
plt.title('Shi-Tomasi Corner Detection')
plt.axis('off')

plt.tight_layout()
plt.show()
```

### SIFT特征提取

```python
# 创建SIFT对象
sift = cv2.SIFT_create()

# 检测关键点和计算描述符
keypoints, descriptors = sift.detectAndCompute(gray_image, None)

# 绘制关键点
sift_image = cv2.drawKeypoints(gray_image, keypoints, None)

# 显示SIFT特征提取结果
plt.figure(figsize=(15, 5))

plt.subplot(1, 2, 1)
plt.imshow(gray_image, cmap='gray')
plt.title('Original Image')
plt.axis('off')

plt.subplot(1, 2, 2)
plt.imshow(sift_image, cmap='gray')
plt.title('SIFT Feature Extraction')
plt.axis('off')

plt.tight_layout()
plt.show()
```

### ORB特征提取

```python
# 创建ORB对象
orb = cv2.ORB_create()

# 检测关键点和计算描述符
keypoints, descriptors = orb.detectAndCompute(gray_image, None)

# 绘制关键点
orb_image = cv2.drawKeypoints(gray_image, keypoints, None)

# 显示ORB特征提取结果
plt.figure(figsize=(15, 5))

plt.subplot(1, 2, 1)
plt.imshow(gray_image, cmap='gray')
plt.title('Original Image')
plt.axis('off')

plt.subplot(1, 2, 2)
plt.imshow(orb_image, cmap='gray')
plt.title('ORB Feature Extraction')
plt.axis('off')

plt.tight_layout()
plt.show()
```

## 目标检测

### Haar级联分类器

```python
# 加载Haar级联分类器
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
eye_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_eye.xml')

# 检测人脸和眼睛
faces = face_cascade.detectMultiScale(gray_image, 1.3, 5)
face_eye_image = image_rgb.copy()

for (x, y, w, h) in faces:
    cv2.rectangle(face_eye_image, (x, y), (x+w, y+h), (255, 0, 0), 2)
    roi_gray = gray_image[y:y+h, x:x+w]
    roi_color = face_eye_image[y:y+h, x:x+w]
    
    eyes = eye_cascade.detectMultiScale(roi_gray)
    for (ex, ey, ew, eh) in eyes:
        cv2.rectangle(roi_color, (ex, ey), (ex+ew, ey+eh), (0, 255, 0), 2)

# 显示Haar级联分类器检测结果
plt.figure(figsize=(15, 5))

plt.subplot(1, 2, 1)
plt.imshow(image_rgb)
plt.title('Original Image')
plt.axis('off')

plt.subplot(1, 2, 2)
plt.imshow(face_eye_image)
plt.title('Haar Cascade Detection')
plt.axis('off')

plt.tight_layout()
plt.show()
```

### HOG特征与SVM

```python
from skimage.feature import hog
from sklearn.svm import SVC
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

# 提取HOG特征
def extract_hog_features(images):
    features = []
    for image in images:
        # 计算HOG特征
        fd = hog(image, orientations=9, pixels_per_cell=(8, 8),
                 cells_per_block=(2, 2), visualize=False)
        features.append(fd)
    return np.array(features)

# 假设我们有一些标记的图像数据
# 这里只是示例，实际应用中需要真实数据
# X_train, X_test, y_train, y_test = train_test_split(images, labels, test_size=0.2)

# 提取训练和测试集的HOG特征
# X_train_hog = extract_hog_features(X_train)
# X_test_hog = extract_hog_features(X_test)

# 训练SVM分类器
# svm = SVC(kernel='linear')
# svm.fit(X_train_hog, y_train)

# 在测试集上评估
# y_pred = svm.predict(X_test_hog)
# accuracy = accuracy_score(y_test, y_pred)
# print(f"Accuracy: {accuracy}")
```

### 深度学习目标检测

```python
# 这里只是示例代码，实际应用中需要安装相应的深度学习框架
# 如TensorFlow或PyTorch，以及预训练模型

# 使用TensorFlow和预训练的SSD模型
"""
import tensorflow as tf

# 加载预训练的SSD模型
model = tf.saved_model.load('ssd_mobilenet_v2_fpnlite_320x320_coco17_tpu-8/saved_model')

# 预处理图像
input_tensor = tf.convert_to_tensor(image_rgb)
input_tensor = input_tensor[tf.newaxis, ...]

# 运行模型
detections = model(input_tensor)

# 解析检测结果
num_detections = int(detections.pop('num_detections'))
detections = {key: value[0, :num_detections].numpy()
              for key, value in detections.items()}
detections['num_detections'] = num_detections

# 过滤检测结果
min_score_thresh = 0.5
detections['detection_classes'] = detections['detection_classes'].astype(np.int64)
indexes = np.where(detections['detection_scores'] > min_score_thresh)[0]

# 绘制检测结果
result_image = image_rgb.copy()
for i in indexes:
    class_id = detections['detection_classes'][i]
    score = detections['detection_scores'][i]
    bbox = detections['detection_boxes'][i]
    
    # 将归一化的边界框转换为像素坐标
    h, w, _ = image_rgb.shape
    y1, x1, y2, x2 = bbox
    y1, x1, y2, x2 = int(y1 * h), int(x1 * w), int(y2 * h), int(x2 * w)
    
    # 绘制边界框和标签
    cv2.rectangle(result_image, (x1, y1), (x2, y2), (0, 255, 0), 2)
    label = f"{class_id}: {score:.2f}"
    cv2.putText(result_image, label, (x1, y1 - 10),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

# 显示检测结果
plt.figure(figsize=(15, 5))

plt.subplot(1, 2, 1)
plt.imshow(image_rgb)
plt.title('Original Image')
plt.axis('off')

plt.subplot(1, 2, 2)
plt.imshow(result_image)
plt.title('Deep Learning Object Detection')
plt.axis('off')

plt.tight_layout()
plt.show()
"""
```

## 总结

计算机视觉是一个广泛而深入的领域，本文介绍了从基础的图像表示和处理到高级的特征提取和目标检测的基本概念和方法。通过学习这些基础知识，读者可以为进一步探索计算机视觉的更高级主题打下坚实的基础。

随着深度学习技术的发展，计算机视觉领域正在经历快速变革。传统的计算机视觉方法与深度学习相结合，正在推动计算机视觉在各个领域的应用不断拓展。希望本文能够帮助读者理解计算机视觉的基本原理，并激发进一步学习和探索的兴趣。

在未来，计算机视觉技术将继续发展，在自动驾驶、医疗诊断、增强现实、机器人技术等领域发挥越来越重要的作用。掌握计算机视觉的基础知识，将为读者在这一充满机遇的领域中发展提供有力支持。