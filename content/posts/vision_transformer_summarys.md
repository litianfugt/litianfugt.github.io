---
title: "vision transformer summary"
date: 2025-09-10T00:00:00+08:00
draft: true
description: "本文主要总结一些优秀的视觉transformer，包括其实现原理，或是基于什么模型进行了哪些改进，一来便于后续做一些任务时的模型选型，同时也可以帮助后续优化模型提供一些方向，比如底层视觉任务中，需要模型更好的感知一些细节或者全局结构，这时候可以考虑在频域或者DCT余弦域做attention或者细节提取。"
keywords: ["vision transformer"]
tags: ["vision transformer"]
categories: ["技术总结"]
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
comments: true
---

# 关于vision transformer的总结记录

本文主要总结一些优秀的视觉transformer，包括其实现原理，或是基于什么模型进行了哪些改进，一来便于后续做一些任务时的模型选型，同时也可以帮助后续优化模型提供一些方向，比如底层视觉任务中，需要模型更好的感知一些细节或者全局结构，这时候可以考虑在频域或者DCT余弦域做attention或者细节提取，然后再变换回去，抑或者是模型推理速度和模型效果的一些平衡问题。

## 1. vision transformer的起点
ViT应该是vision transformer中最早能把相关任务效果做到SOTA的模型。在此之前还有一个开创性的工作iGPT值得关注。iGPT将图像像素按从左到右从上到下看成一个序列，这样就可以按照NLP的思路来学习相关特征了。iGPT尝试了GPT（AR，自回归）和Bert两种预训练方式，其探索了在没有使用2D结构先验信息的情况下，完全基于序列的方式也能学到很好的图像表征特征。但是其存在一个较大的问题--输入图像尺寸的问题。由于其需要将输入图像降质为32x32等比较低的分辨率，其对高分辨率图像的特征学习能力有限。ViT也是想让模型在图像数据集上的预训练发挥更好的作用，同时解决对中高分辨率图像的表征作用。其核心思想是将图像分割成一个个pxp（16x16）大小的图像块（patch），然后将每个patch对应NLP领域中的词（word）。先对每个patch进行向量嵌入（patch embedding），再叠加一个相同维度可学习的位置向量（position embedding），然后按照Bert的预训练方式在大型图像数据集上训练ViT模型，当然其进行的预训练包括分类，其在输入向量最前面嵌入了一个【class】向量，作为预训练或者微调时分类头的输入。ViT最大的贡献有三点，其一，提出了一种更有效的在图像领域预训练transformer的方法，并且基于预训练后的模型在特定任务上微调可以比肩甚至超过当前最好的CNN模型。其二，证实了类似于卷积这种能先天利用二维信息的偏置只是能在训练数据量较小时提供一个更好的先验信息而已，在较大数据集上预训练ViT能提供同等甚至更好的先验信息，其可学习的位置向量最后展现出了明显的2D信息。其三，虽然预训练对CNN模型也有效果提升，但是在相同计算资源的情况下，预训练ViT的收益更大，此外，当不受数据量和训练资源限制时，ViT的性能提升也没有出现像CNN模型那样的饱和情况，其在更大规模的数据集上的应用前景更好。

ViT告诉我们只要在足够大的数据集上预训练，纯transformer架构的网络能够在视觉任务上比肩甚至超越现阶段最好的卷积网络。然而，在大规模数据集上预训练是一件非常费事费资源的事情。这也非常限制transformer在视觉任务中的使用。为了解决这个问题，DeiT尝试通过一些优化策略和引入创新的蒸馏方法，使得transformer模型在不预训练的情况下仅使用相同规模数据集也能达到SOTA性能。其核心点是使用一个卷积网络（如RegNeY-16GF）作为教师模型去辅助训练ViT，将一些卷积具有的归纳偏置传递给ViT。实现这一点的创新蒸馏方式则是引入一个额外的蒸馏token，类似于class token，让其对齐教师模型预测的硬标签（论文指出硬标签比软标签的效果好），同时结合class token与实际类别的联合约束，最终使得纯transformer模型能够在小规模数据集上达到SOTA性能。

