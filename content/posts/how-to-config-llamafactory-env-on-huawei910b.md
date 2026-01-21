---
title: "How-to-Config-Llamafactory-Env-on-Huawei910b"
date: 2026-01-21T10:47:06+08:00
draft: true
description: "主要介绍如何基于移动AI开发平台的基础昇腾910b的镜像构建LlamaFactory的运行环境"
keywords: []
tags: [‘llamafactory’，‘huawei910b’]
categories: [‘大模型’]
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
---

# 如何基于移动AI开发平台的基础昇腾910b的镜像构建LlamaFactory的运行环境

## 0.前言
关于昇腾生态环境的配置可以参考其官方文档：https://ascend.github.io/docs/index.html
开发平台上选择的基础镜像已经配置好了一些基础的昇腾环境，可以运行其提供的一些微调代码，但是要运行Llama Factory框架，还是存在很多不兼容的地方。
参考官方文档中对Llama Factory的支持说明：LLAMA-Factory 支持的 CANN 最低版本为 8.0.rc1。安装 CANN 时，请同时安装 Kernel 算子包。https://ascend.github.io/docs/sources/llamafactory/install.html
而移动AI平台的基础镜像的CANN配置为7.0.0，因此需要更新CANN库。

## 1.CANN库更新

CANN版本要根据我们使用的pytorch版本确定，可以基于官网https://ascend.github.io/docs/sources/pytorch/install.html#pytorch 去看不同的pytorch对应哪个版本的pytorch-npu以及CANN版本，我们下载的Llama Factory里面推荐的pytorch版本是2.7.1，因此需要安装CANN 8.2.RC1版本。CANN的版本更新方式可以参考https://ascend.github.io/docs/sources/ascend/quick_install.html 基于需要的版本看是否需要更新驱动以及固件，但是这两个因为我们使用的是AI平台上的镜像，我们没有权限去更新，因为更新后会影响到其他用户的使用，因此要看我们需要的CANN版本能不能得到当前驱动和固件的支持。

### 1.1 系统相关配置确认
确认昇腾AI处理器已经安装妥当

```bash
lspci | grep 'Processing accelerators'
```
如果没有找到```lspci```这个命令，需要安装包含该工具的软件包```pciutils```, 即：
```bash
apt-get update
apt-get install -y pciutils
```

然后确认操作系统架构及版本
```bash
uname -m && cat /etc/*release
```
确认python版本
```bash
python --version
```
### 1.2 环境配置
接下来基于我们要安装的llamafactory版本，pytorch版本， pytorch-npu版本， 确定我们需要安装CANN版本（包括算子库版本）以及其固件版本。
注意这些库跟python版本的兼容性，比如我现在最新的llamafactory 0.9.5.dev0版本需要python3.11

#### 1.2.1 安装依赖
```bash
apt-get install -y gcc make net-tools python3 python3-dev python3-pip
```
这些部分工具都是我们要安装后续库进行编译等需要用到的工具

#### 1.2.2 创建驱动运行用户
```bash
groupadd HwHiAiUsersudo u
seradd -g HwHiAiUser -d /home/HwHiAiUser -m HwHiAiUser -s /bin/bashsudo 
usermod -aG HwHiAiUser $USER
```
*这部分不是很明白用来干嘛的*

#### 1.2.3 安装驱动与固件
（由于我们直接使用的AI平台上已有的基础镜像，驱动和固件都已经安装好了，我们没有权限去更新驱动和固件，这回影响到其他程序的运行，因此我们跳过这部分，但是对于不是使用AI平台的话还是需要进行以下配置）
当然驱动和固件也要跟实际的硬件型号相对应，具体相关的可以去找华为NPU相关的资料查询
```bash
# 下载并安装驱动
wget "https://ascend-repo.obs.cn-east-2.myhuaweicloud.com/Ascend HDK/Ascend HDK 25.0.RC1.1/Ascend-hdk-910b-npu-driver_25.0.rc1.1_linux-aarch64.run"
bash Ascend-hdk-910b-npu-driver_25.0.rc1.1_linux-aarch64.run --full --install-for-all

#使用以下命令查看驱动是否安装成功
npu-smi info

#下载并安装固件
wget "https://ascend-repo.obs.cn-east-2.myhuaweicloud.com/Ascend HDK/Ascend HDK 25.0.RC1.1/Ascend-hdk-910b-npu-firmware_7.7.0.1.231.run"
bash Ascend-hdk-910b-npu-firmware_7.7.0.1.231.run --full
```
安装固件后，若系统出现如下关键回显信息，表示固件安装成功。
```
Firmware package installed successfully!
```
#### 1.2.4 安装CANN库及算子库
先安装python依赖
```bash
pip3 install -i https://pypi.tuna.tsinghua.edu.cn/simple attrs cython numpy==1.24.0 decorator sympy cffi pyyaml pathlib2 psutil protobuf==3.20 scipy requests absl-py
```
下载并安装CANN 8.2.RC1版本
```bash
wget "https://ascend-repo.obs.cn-east-2.myhuaweicloud.com/CANN/CANN 8.2.RC1/Ascend-cann-toolkit_8.2.RC1_linux-aarch64.run"
bash Ascend-cann-toolkit_8.2.RC1_linux-aarch64.run --full
```
这里安装的时候可能会出现问题，安装CANN库时pip其编译安装会指定安装目录```--prefix/--target``` 其与pip默认的```--user```安装路径冲突，需要进入pip config文件删除默认的user安装指令，可以通过```cat ～/.pip/pip.conf```查看其中有``` --user=true```,并将这一行删除。

安装CANN-toolkit后，若系统出现以下关键回显信息，表示CANN-toolkit安装成功。
```
Ascend-cann-toolkit install success.
```
设置环境变量
```bash
source /usr/local/Ascend/ascend-toolkit/set_env.sh
```
安装算子包
```bash
wget "https://ascend-repo.obs.cn-east-2.myhuaweicloud.com/CANN/CANN 8.2.RC1/Ascend-cann-kernels-910b_8.2.RC1_linux-aarch64.run"
bash Ascend-cann-kernels-910b_8.2.RC1_linux-aarch64.run --install
```
安装算子包后，若系统出现以下关键回显信息，表示算子包安装成功。
```
Ascend-cann-kernels install success.
```

## 2. Llamafactory框架下载与环境配置
更新好支持我们需要的CANN库版本后，可以着手配置llamafactory环境了。

```bash
# 首先下载llamafactory # 当前最新是0.9.5.dev0
git clone https://github.com/hiyouga/LLaMA-Factory.git
cd LLaMA-Factory

# 创建并激活 Python 环境, 注意版本跟llamafactory兼容
conda create -y -n llamafactory python=3.11。 # 这里我们安装python3.11 
conda activate llamafactory

# 安装所需要的关联库
pip install -e ".[npu,metrics]" -i https://pypi.tuna.tsinghua.edu.cn/simple

# 检查是否安装成功
llamafactory-cli env

#如果显示一下信息 表示安装陈工
- `llamafactory` version: 0.9.5.dev0
- Platform: Linux-4.19.90-2107.6.0.0192.8.oe1.bclinux.aarch64-aarch64-with-glibc2.31
- Python version: 3.11.14
- PyTorch version: 2.7.1+cpu (NPU)
- Transformers version: 4.57.1
- Datasets version: 4.0.0
- Accelerate version: 1.11.0
- PEFT version: 0.17.1
- NPU type: Ascend910B2
- CANN version: 8.2.RC1
- TRL version: 0.24.0
- DeepSpeed version: 0.16.9
- Git commit: 9829ae0a778eaecde49380569f1609d1d8284629
- Default data directory: detected
```

最后运行```llamafactory-cli env```可能会报错，类似于```[Error]: The internal ACL of the system is incorrect.```
这是CANN 8.2.RC1 与 PyTorch-NPU 2.7.1 的API 兼容性问题， 华为 CANN 8.2.RC1 的 AclSetCompileopt 函数需要特定的参数，而 PyTorch-NPU 2.7.1 的默认参数与 CANN 8.2.RC1 不兼容。
解决方法：强制设置精度模式
```bash
#在容器内设置环境变量
# 1. 设置精度模式为 "fp16"（CANN 8.2.RC1 推荐值）
export ASCEND_SLOG_PRINT_TO_STDOUT=1
export ASCEND_GLOBAL_LOG_LEVEL=3
export ASCEND_PRECISION_MODE=fp16  # 关键：强制设置精度模式

# 2. 确认设置
echo "ASCEND_PRECISION_MODE: $ASCEND_PRECISION_MODE"

#可能还需要安装 decorator库
# 在容器内执行
pip install decorator==5.1.1  # 确保安装兼容版本
```
然后运行```llamafactory-cli env```就可以正常显示并调用系统信息了，表明环境配置成功


## 3. 基于LoRA的模型微调
### 3.1 yaml 配置文件
在 LLAMA-Factory 目录下，创建如下 qwen1_5_lora_sft_ds.yaml：
```yaml
### model
model_name_or_path: /root/work/filestorage/litianfu/pretrain/Qwen1.5-7B # 我们下载后的模型及其配置文件保存路径

### method
stage: sft
do_train: true
finetuning_type: lora
lora_target: q_proj,v_proj

### ddp
ddp_timeout: 180000000
deepspeed: examples/deepspeed/ds_z0_config.json

### dataset
dataset: identity,alpaca_en_demo
template: qwen
cutoff_len: 1024
max_samples: 1000
overwrite_cache: true
preprocessing_num_workers: 16

### output
output_dir: /root/work/filestorage/litianfu/saves/Qwen1.5-7B/lora/sft # 指定输出路径
logging_steps: 10
save_steps: 500
plot_loss: true
overwrite_output_dir: true

### train
per_device_train_batch_size: 1
gradient_accumulation_steps: 2
learning_rate: 0.0001
num_train_epochs: 3.0
lr_scheduler_type: cosine
warmup_ratio: 0.1
fp16: true

### eval
val_size: 0.1
per_device_eval_batch_size: 1
eval_strategy: steps
eval_steps: 500
```

### 3.2 使用modelscope下载qwen1.5-7B相关模型配置及权重
```bash
modelscope download --model Qwen/Qwen1.5-7B --local_dir ./pretrain/Qwen1.5-7B # 注意这里的local_dir要用挂在的大硬盘地址，work里面的内存是高速内存，容量有限
```

### 3.3 开启微调
``` bash
torchrun --nproc_per_node 1 \
    --nnodes 1 \
    --node_rank 0 \
    --master_addr 127.0.0.1 \
    --master_port 7007 \
    src/train.py qwen1_5_lora_sft_ds.yaml
```
这里运行train可能会报错```cannot allocate memory in static TLS block```,这是因为模型运行时依赖三方库文件的实际加载顺序受环境中glibc版本、三方库加载时机以及实际依赖库版本等因素影响，部分场景下生成的加载顺序无法顺利触发DTV表的扩容机制，导致DTV表耗尽，触发该问题。
解决方法是使用LD_PRELOAD环境变量指定对报错的单个或多个库文件进行优先加载。
```bash
export LD_PRELOAD=/root/.local/conda/envs/llamafactory/bin/../lib/libgomp.so.1
```
为了方便运行我们可以创建一个shell脚本run_train.sh:
```shell
export LD_PRELOAD=/root/.local/conda/envs/llamafactory/bin/../lib/libgomp.so.1
torchrun --nproc_per_node 1 \
    --nnodes 1 \
    --node_rank 0 \
    --master_addr 127.0.0.1 \
    --master_port 7007 \
    src/train.py configs/qwen1_5_lora_sft_ds.yaml
```
直接运行这个shell脚本就可以正常训练啦，呜呼。

训练完成后可以基于llamafactory框架直接进行推理问答，使用一个run_inference.sh脚本就可以开启对话了。
```shell
export LD_PRELOAD=/root/.local/conda/envs/llamafactory/bin/../lib/libgomp.so.1
llamafactory-cli chat --model_name_or_path /root/work/filestorage/litianfu/pretrain/Qwen1.5-7B \
            --adapter_name_or_path /root/work/filestorage/litianfu/saves/Qwen1.5-7B/lora/sft \
            --template qwen \
            --finetuning_type lora
```
总结一下，使用 Qwen1.5-7B 模型微调和推理的完整脚本如下：
```bash
# use modelscope
export USE_MODELSCOPE_HUB=1

# specify NPU
export ASCEND_RT_VISIBLE_DEVICES=0

### qwen/Qwen1.5-7B
### finetune
torchrun --nproc_per_node 1 \
    --nnodes 1 \
    --node_rank 0 \
    --master_addr 127.0.0.1 \
    --master_port 7007 \
    src/train.py <your_path>/qwen1_5_lora_sft_ds.yaml

### inference -- chat
llamafactory-cli chat --model_name_or_path qwen/Qwen1.5-7B \
            --adapter_name_or_path saves/Qwen1.5-7B/lora/sft \
            --template qwen \
            --finetuning_type lora
```

